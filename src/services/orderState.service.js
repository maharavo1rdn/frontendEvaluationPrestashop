import parseOrderStates from "../XMLUtil/parser/OrderState.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_states?output_format=XML&display=${display}`,
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
    return parseOrderStates(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderState = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_states/${id}`, {
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

export const resetOrderStates = async () => {
  try {
    const states = await getAll();
    for (const state of states) {
      await deleteOrderState(state.id);
    }
  } catch (error) {
    throw error;
  }
};
