import parseOrderPayments, {
  parseOrderPayment,
} from "../XMLUtil/parser/OrderPayment.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildOrderPaymentXML } from "../XMLUtil/builder/OrderPayment.builder";
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
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0]?.message || "inconnue"
        }`,
      );
    }
    const xmlText = await response.text();
    return parseOrderPayments(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postOrderPayment = async (payment) => {
  const xml = buildOrderPaymentXML(payment);
  try {
    const response = await fetch(`${API_URL()}/order_payments?output_format=XML`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
        "Content-Type": "application/xml",
      },
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseOrderPayment(xmlText);
    return { success: true, id: created?.id };
  } catch (err) {
    return { success: false, error: err.message };
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
				`Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
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
