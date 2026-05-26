import parseStockAvailables, {
  parseStockAvailable,
} from "../XMLUtil/parser/StockAvailable.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildStockAvailableXML } from "../XMLUtil/builder/StockAvailable.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { findProductByKeyValue, postProduct } from "./product.service";

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
    return parseStockAvailables(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findStockAvailableByProductAttribute = async (
  productId,
  productAttributeId
) => {
  try {
    const params = new URLSearchParams({
      "filter[id_product]": `[${productId}]`,
      "filter[id_product_attribute]": `[${productAttributeId}]`,
      output_format: "XML",
      display: "full",
    });

    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");
    const response = await fetch(
      `${API_URL()}/stock_availables?${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseStockAvailables(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getStockAvailableById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/stock_availables/${id}?output_format=XML`,
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
    return parseStockAvailable(xmlText);
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

export const postStockAvailable = async (stock) => {
  const xml = buildStockAvailableXML(stock);
  try {
    const response = await fetch(
      `${API_URL()}/stock_availables?output_format=XML`,
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
    const created = parseStockAvailable(xmlText);
    return { success: true, id: created?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const updateStockAvailable = async (stock) => {
  if (!stock?.id) {
    return { success: false, error: "Id stock manquant" };
  }
  const xml = buildStockAvailableXML(stock);
  try {
    const response = await fetch(
      `${API_URL()}/stock_availables/${stock.id}?output_format=XML`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: xml,
      }
    );
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const updated = parseStockAvailable(xmlText);
    return { success: true, id: updated?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const resetStockAvailables = async () => {
  try {
    const stocks = await getAll();

    if (!stocks || stocks.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < stocks.length; i += chunkSize) {
      const chunk = stocks.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((stock) => deleteStockAvailable(stock.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};

export const getStockByProductAndAttribute = async (
  productId,
  productAttributeId
) => {
  try {
    const response = await fetch(
      `${API_URL()}/stock_availables?filter[id_product]=${productId}&filter[id_product_attribute]=${productAttributeId}&output_format=XML&display=full`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok) return null;
    const xml = await response.text();
    const stock = parseStockAvailables(xml);
    return stock;
  } catch (err) {
    console.error("Erreur récupération stock combinaison", err);
    return null;
  }
};

export const findStockAvailablesByProductId = async (productId) => {
  try {
    const response = await fetch(
      `${API_URL()}/stock_availables?filter[id_product]=[${productId}]&display=full`,
      { headers: authHeaders() }
    );
    if (!response.ok) return [];
    const xmlText = await response.text();
    return parseStockAvailables(xmlText);
  } catch (error) {
    console.error("Error fetching stock availables:", error);
    return [];
  }
};

export const removeStock = async (idCat, quantity) => {
  try {
    const relatedProducts = await findProductByKeyValue(
      "id_category_default",
      idCat
    );

    const result = {};
    result.affected = 0;
    result.realeased = 0;

    await Promise.all(
      relatedProducts.map(async (product) => {
        if (product.associations.combinations.length == 0) {
          const stockAvailables = await findStockAvailableByProductAttribute(
            product.id,
            0
          );
          const stock_available = stockAvailables[0];
          const delta =
            parseInt(stock_available.quantity) - parseInt(Number(quantity));

          const newQuantity = delta >= 0 ? delta : 0;
          const rest =
            delta >= 0
              ? parseInt(Number(quantity))
              : parseInt(stock_available.quantity);

          result.affected += parseInt(Number(quantity));
          result.realeased += rest;
          await updateStockAvailable({
            id: stock_available.id,
            idProduct: product.id,
            idProductAttribute: 0,
            idShop: 1,
            quantity: newQuantity,
            dependsOnStock: 0,
            outOfStock: 2,
          });
        } else {
          product.associations.combinations.map(async (combination) => {
            const stockAvailables = await findStockAvailableByProductAttribute(
              product.id,
              combination
            );

            const stock_available = stockAvailables[0];
            const delta =
              parseInt(stock_available.quantity) - parseInt(Number(quantity));

            const newQuantity = delta >= 0 ? delta : 0;
            const rest =
              delta >= 0
                ? parseInt(Number(quantity))
                : parseInt(stock_available.quantity);

            result.affected += parseInt(Number(quantity));
            result.realeased += rest;
            await updateStockAvailable({
              id: stock_available.id,
              idProduct: product.id,
              idProductAttribute: combination,
              idShop: 1,
              quantity: newQuantity,
              dependsOnStock: 0,
              outOfStock: 2,
            });
          });
        }
      })
    );

    console.log(result);

    return result;
  } catch (error) {
    console.error(error);
  }
};
