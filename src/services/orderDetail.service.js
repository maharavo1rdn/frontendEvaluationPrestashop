import parseOrderDetails from "../XMLUtil/parser/OrderDetail.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_details?output_format=XML&display=${display}`,
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
    return parseOrderDetails(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderDetail = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_details/${id}`, {
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

export const resetOrderDetails = async () => {
  try {
    const details = await getAll();
    for (const detail of details) {
      await deleteOrderDetail(detail.id);
    }
  } catch (error) {
    throw error;
  }
};
