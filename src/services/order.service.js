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
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)?.[0]?.message || "inconnue"
        }`
      );
    }
    const xmlText = await response.text();
    const orders = parseOrders(xmlText);

    // ajouter des codes pour le statut actuel de la commande
    const ordersWithStates = await Promise.all(
      orders.map(async (order) => {
        try {
          if (order.currentState) {
            const stateData = await findOrderStateByKeyValue(
              "id",
              order.currentState
            );
            order.current_state_label = stateData?.[0]?.name || "Inconnu";
          } else {
            order.current_state_label = "Inconnu";
          }
        } catch (e) {
          order.current_state_label = "Inconnu";
        }
        return order;
      })
    );

    return ordersWithStates;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/orders/${id}?output_format=XML`,
      {
        headers: authHeaders(),
      }
    );
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    return parseOrder(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findOrderByKeyValue = async (key, value) => {
  try {
    const params = new URLSearchParams({
      [`filter[${key}]`]: `[${value}]`,
      output_format: "XML",
      display: "full",
    });
    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");

    const response = await fetch(`${API_URL()}/orders?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    return parseOrders(xmlText);
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

export const putOrder = async (orderId, orderPayload) => {
  const xml = buildOrderXML({ ...orderPayload, id: orderId });
  try {
    const response = await fetch(
      `${API_URL()}/orders/${orderId}?output_format=XML`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: xml,
      }
    );
    const xmlText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const updated = parseOrder(xmlText);
    return {
      success: true,
      id: updated?.id,
      reference: updated?.reference,
    };
  } catch (err) {
    return { success: false, id: orderId, error: err.message };
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
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
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

    if (!orders || orders.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((order) => deleteOrder(order.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};
