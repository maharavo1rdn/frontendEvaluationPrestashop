import parseOrderHistories from "../XMLUtil/parser/OrderHistory.parser";
import { API_URL, WS_KEY } from "../config/config.service";

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
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    const xmlText = await response.text();
    return parseOrderHistories(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderHistory = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_histories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
      },
    });
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetOrderHistories = async () => {
  try {
    const histories = await getAll();
    histories.forEach((history) => {
      deleteOrderHistory(history.id);
    });
  } catch (error) {
    throw error;
  }
};
