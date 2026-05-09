import parseOrderCarriers from "../XMLUtil/parser/OrderCarrier.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_carriers?output_format=XML&display=${display}`,
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
    return parseOrderCarriers(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderCarrier = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_carriers/${id}`, {
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

export const resetOrderCarriers = async () => {
  try {
    const carriers = await getAll();
    for (const carrier of carriers) {
      await deleteOrderCarrier(carrier.id);
    }
  } catch (error) {
    throw error;
  }
};
