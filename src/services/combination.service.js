import parseCombinations, {
  parseCombination,
} from "../XMLUtil/parser/Combination.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildCombinationXML } from "../XMLUtil/builder/Combination.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/combinations?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    const xmlText = await response.text();
    return parseCombinations(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findCombinationsByProductId = async (productId) => {
  try {
    const params = new URLSearchParams({
      "filter[id_product]": `[${productId}]`,
      output_format: "XML",
      display: "full",
    });

    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");
    const response = await fetch(`${API_URL()}/combinations?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseCombinations(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCombinationById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/combinations/${id}?output_format=XML`,
      { headers: authHeaders() }
    );
    const xmlText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${xmlText}`);
    return parseCombination(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postCombination = async (combination) => {
  const xml = buildCombinationXML(combination);
  try {
    const response = await fetch(
      `${API_URL()}/combinations?output_format=XML`,
      {
        method: "POST",
        headers: authHeaders(),
        body: xml,
      }
    );
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseCombination(xmlText);
    return {
      success: true,
      id: created?.id,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteCombination = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/combinations/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetCombinations = async () => {
  try {
    const combinations = await getAll();

    if (!combinations || combinations.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    const results = [];

    for (let i = 0; i < combinations.length; i += chunkSize) {
      const chunk = combinations.slice(i, i + chunkSize);

      const deletePromises = chunk.map((combination) =>
        deleteCombination(combination.id)
      );

      const chunkResults = await Promise.all(deletePromises);
      results.push(...chunkResults);
    }

    return { success: true, deleted: results.length };
  } catch (error) {
    console.error("Erreur lors du reset des déclinaisons:", error);
    throw error;
  }
};
