import { buildProductXML } from "../XMLUtil/builder/Product.builder";
import parseProducts, { parseProduct } from "../XMLUtil/parser/Product.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { getStockAvailableById } from "./stockAvailable.service";

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
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    }
    const xmlText = await response.text();
    return parseProducts(xmlText);
  } catch (error) {
    throw error;
  }
};

const extractImagesFromProduct = (product) => {
  const raw = product?.associations?.images;
  if (!raw) return [];
  // Selon le parser, c'est soit un tableau soit un objet unique
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((img) => img?.id).map((img) => ({ id: String(img.id) }));
};

/**
 * Enrichit un produit avec son stock et ses images.
 * Les images viennent des associations déjà présentes dans le produit parsé.
 */
const enrichProduct = async (product) => {
  const stockId = product?.associations?.stockAvailables?.[0]?.id;

  const stock = stockId
    ? await getStockAvailableById(stockId).catch(() => null)
    : null;

  return {
    ...product,
    stockQuantity: stock?.quantity ?? null,
    images: extractImagesFromProduct(product),
  };
};

/**
 * Retourne tous les produits enrichis avec stock et images.
 */
export const getAllEnriched = async () => {
  const products = await getAll();
  return Promise.all(products.map(enrichProduct));
};

/**
 * Recherche des produits et les enrichit avec stock et images.
 */
export const searchProductsEnriched = async (filters) => {
  const products = await searchProducts(filters);
  return Promise.all(products.map(enrichProduct));
};

export const searchProducts = async ({
  name,
  categoryId,
  minPrice,
  maxPrice,
}) => {
  const params = new URLSearchParams();
  params.append("output_format", "XML");
  params.append("display", "full");

  if (categoryId) {
    params.append("filter[id_category_default]", `[${categoryId}]`);
  }
  if (
    minPrice !== undefined &&
    minPrice !== "" &&
    maxPrice !== undefined &&
    maxPrice !== ""
  ) {
    params.append("filter[price]", `[${minPrice},${maxPrice}]`);
  } else if (minPrice !== undefined && minPrice !== "") {
    params.append("filter[price]", `[${minPrice},]`);
  } else if (maxPrice !== undefined && maxPrice !== "") {
    params.append("filter[price]", `[,${maxPrice}]`);
  }

  const queryString = params
    .toString()
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]");
  const response = await fetch(`${API_URL()}/products?${queryString}`, {
    headers: {
      Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
      Accept: "application/xml",
    },
  });
  if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
  const xmlText = await response.text();
  let products = parseProducts(xmlText);
  if (name) {
    const searchName = name.toLowerCase();
    products = products.filter((p) =>
      p.name?.toLowerCase().includes(searchName)
    );
  }
  return products;
};

export const findProductByKeyValue = async (key, value) => {
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
    const response = await fetch(`${API_URL()}/products?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseProducts(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getProductById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/products/${id}?output_format=XML`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      const errors = parseErrors(errText);
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          errors[0]?.message || "Produit introuvable"
        }`
      );
    }

    const xmlText = await response.text();
    const product = parseProduct(xmlText);

    if (product) {
      product.images = extractImagesFromProduct(product);
    }

    return product;
  } catch (error) {
    console.error(`[ProductService] Error in getProductById(${id}):`, error);
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
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseProduct(xmlText);
    return {
      success: true,
      name: category.name,
      id: created?.id,
    };
  } catch (err) {
    return { success: false, name: category.name, error: err.message };
  }
};

export const deleteProduct = async (id) => {
  const safeErrorMessage = (errText) => {
    try {
      const parsed = parseErrors(errText);
      if (parsed?.length) return parsed[0].message || "inconnue";
    } catch (e) {}
    return errText?.trim() || "inconnue";
  };

  try {
    const response = await fetch(
      `${API_URL()}/products/${id}?output_format=XML`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 500) {
        const verify = await fetch(
          `${API_URL()}/products/${id}?output_format=XML`,
          {
            headers: {
              Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
              Accept: "application/xml",
            },
          }
        );
        if (verify.status === 404) return response;
      }
      throw new Error(
        `Erreur HTTP ${response.status} — ${safeErrorMessage(errText)}`
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
    if (!products || products.length === 0)
      return { success: true, deleted: 0 };

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const results = await Promise.all(chunk.map((p) => deleteProduct(p.id)));
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};
