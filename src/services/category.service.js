import parseCategories, {
  parseCategory,
} from "../XMLUtil/parser/Category.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { buildCategoryXML } from "../XMLUtil/builder/Category.builder";
const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/categories?output_format=XML&display=${display}`,
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
    return parseCategories(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postCategory = async (category) => {
  const xml = buildCategoryXML(category);
  try {
    const response = await fetch(`${API_URL()}/categories?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseCategory(xmlText);
    return {
      success: true,
      name: category.name,
      id: created?.id,
    };
  } catch (err) {
    return { success: false, name: category.name, error: err.message };
  }
};

export const findCategoryByKeyValue = async (key, value) => {
  try {
    const params = new URLSearchParams({
      [`filter[${key}]`]: `[${value}]`,
      output_format: "XML",
      display: "full",
    });

    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");
    const response = await fetch(`${API_URL()}/categories?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseCategories(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/categories/${id}`, {
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

export const resetCategories = async () => {
  try {
    const categories = await getAll();

    const toDelete = categories
      .filter((category) => Number(category.id) >= 3)
      .sort((a, b) => {
        const depthA = Number(a.levelDepth) || 0;
        const depthB = Number(b.levelDepth) || 0;
        if (depthA !== depthB) return depthB - depthA;
        return Number(b.id) - Number(a.id);
      });

    let totalDeleted = 0;

    for (const category of toDelete) {
      try {
        await deleteCategory(category.id);
        totalDeleted++;
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          throw error;
        }
      }
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};
