import parseOrderHistories, { parseOrderHistory } from "../XMLUtil/parser/OrderHistory.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildOrderHistoryXML } from "../XMLUtil/builder/OrderHistory.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_histories?output_format=XML&display=${display}`,
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
    return parseOrderHistories(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postOrderHistory = async (history) => {
  const xml = buildOrderHistoryXML(history);
  try {
    const response = await fetch(
      `${API_URL()}/order_histories?output_format=XML`,
      {
        method: "POST",
        headers: authHeaders(),
        body: xml,
      },
    );
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseOrderHistory(xmlText);
    return {
      success: true,
      id: created?.id,
    };
  } catch (err) {
    return { success: false, id: history.id, error: err.message };
  }
};

export const deleteOrderHistory = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_histories/${id}`, {
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

export const resetOrderHistories = async () => {
  try {
    const histories = await getAll();
    for (const history of histories) {
      await deleteOrderHistory(history.id);
    }
  } catch (error) {
    throw error;
  }
};
