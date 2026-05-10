import parseCategories from "../XMLUtil/parser/Category.parser";
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
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
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
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} — ${errText}`);
    }
    return { success: true, name: category.name };
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
				`Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
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
    for (const category of categories) {
      await deleteCategory(category.id);
    }
  } catch (error) {
    throw error;
  }
};
