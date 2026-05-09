import parseOrderInvoices from "../XMLUtil/parser/OrderInvoice.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_invoices?output_format=XML&display=${display}`,
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
    return parseOrderInvoices(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderInvoice = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_invoices/${id}`, {
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

export const resetOrderInvoices = async () => {
  try {
    const invoices = await getAll();
    for (const invoice of invoices) {
      await deleteOrderInvoice(invoice.id);
    }
  } catch (error) {
    throw error;
  }
};
