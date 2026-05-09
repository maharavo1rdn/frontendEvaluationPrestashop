import parseOrderPayments from "../XMLUtil/parser/OrderPayment.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_payments?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    const xmlText = await response.text();
    return parseOrderPayments(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderPayment = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_payments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${errText || response.statusText}`,
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetOrderPayments = async () => {
  try {
    const payments = await getAll();
    for (const payment of payments) {
      await deleteOrderPayment(payment.id);
    }
  } catch (error) {
    throw error;
  }
};
