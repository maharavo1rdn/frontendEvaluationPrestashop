import parseOrders from "../XMLUtil/parser/Order.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY } from "../config/config.service";

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
  } catch (error) {
    throw error;
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
