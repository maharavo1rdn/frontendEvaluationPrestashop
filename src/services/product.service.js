import { buildProductXML } from "../XMLUtil/builder/Product.builder";
import parseProducts from "../XMLUtil/parser/Product.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/products?output_format=XML&display=${display}`,
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
    return parseProducts(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postProduct = async (category) => {
  const xml = buildProductXML(category);
  try {
    const response = await fetch(`${API_URL()}/products?output_format=XML`, {
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

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/products/${id}`, {
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

export const resetProducts = async () => {
  try {
    const products = await getAll();
    for (const product of products) {
      await deleteProduct(product.id);
    }
  } catch (error) {
    throw error;
  }
};
