import parseOrders, { parseOrder } from "../XMLUtil/parser/Order.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildOrderXML } from "../XMLUtil/builder/Order.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { findOrderStateByKeyValue } from "./orderState.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/orders?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
      );
      const xmlText = await response.text();
      return parseOrders(xmlText);
      // ajouter des codes pour le statut actuel de la commande
      // findOrderStateByKeyValue("id",order[0].current_state)
  } catch (error) {
    throw error;
  }
};

export const postOrder = async (order) => {
  const xml = buildOrderXML(order);
  try {
    const response = await fetch(`${API_URL()}/orders?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseOrder(xmlText);
    return {
      success: true,
      id: created?.id,
      reference: created?.reference,
    };
  } catch (err) {
    return { success: false, id: order.id, error: err.message };
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/orders/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
				`Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetOrders = async () => {
  try {
    const orders = await getAll();
    for (const order of orders) {
      await deleteOrder(order.id);
    }
  } catch (error) {
    throw error;
  }
};
