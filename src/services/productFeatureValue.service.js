import parseProductFeatureValues from "../XMLUtil/parser/ProductFeatureValue.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/product_feature_values?output_format=XML&display=${display}`,
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
    return parseProductFeatureValues(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteProductFeatureValue = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/product_feature_values/${id}`, {
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

export const resetProductFeatureValues = async () => {
  try {
    const values = await getAll();
    for (const value of values) {
      await deleteProductFeatureValue(value.id);
    }
  } catch (error) {
    throw error;
  }
};
