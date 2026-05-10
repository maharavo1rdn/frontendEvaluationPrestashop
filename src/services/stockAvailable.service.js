import parseStockAvailables from "../XMLUtil/parser/StockAvailable.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/stock_availables?output_format=XML&display=${display}`,
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
    return parseStockAvailables(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteStockAvailable = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/stock_availables/${id}`, {
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

export const resetStockAvailables = async () => {
  try {
    const stocks = await getAll();
    for (const stock of stocks) {
      await deleteStockAvailable(stock.id);
    }
  } catch (error) {
    throw error;
  }
};
