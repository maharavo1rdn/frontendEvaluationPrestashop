import parseCategories from "../XMLUtil/parser/Category.parser";
import { API_URL, WS_KEY } from "../config/config.service";

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
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    const xmlText = await response.text();
    return parseCategories(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/categories/${id}`, {
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

export const resetCategories = async () => {
  try {
    const categories = await getAll();
    categories.forEach((category) => {
      deleteCategory(category.id);
    });
  } catch (error) {
    throw error;
  }
};
