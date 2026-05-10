import parseOrderSlips from "../XMLUtil/parser/OrderSlip.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_slips?output_format=XML&display=${display}`,
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
    return parseOrderSlips(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderSlip = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_slips/${id}`, {
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

export const resetOrderSlips = async () => {
  try {
    const slips = await getAll();
    for (const slip of slips) {
      await deleteOrderSlip(slip.id);
    }
  } catch (error) {
    throw error;
  }
};
