import parseStockAvailables, {
  parseStockAvailable,
} from "../XMLUtil/parser/StockAvailable.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildStockAvailableXML } from "../XMLUtil/builder/StockAvailable.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

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

const buildStockItemMovementXML = ({
  idProduct,
  idProductAttribute = 0,
  deltaQuantity,
  idShop,
}) => `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_item>
    <id_product><![CDATA[${Number(idProduct)}]]></id_product>
    <id_product_attribute><![CDATA[${Number(
      idProductAttribute || 0
    )}]]></id_product_attribute>
    <delta_quantity><![CDATA[${Number(deltaQuantity)}]]></delta_quantity>
    ${idShop ? `<id_shop><![CDATA[${Number(idShop)}]]></id_shop>` : ""}
  </stock_item>
</prestashop>`;

const parseXmlResponseOrThrow = async (response) => {
  const text = await response.text();

  if (!response.ok) {
    const errors = parseErrors(text);
    if (errors.length > 0) {
      throw new Error(errors.map((error) => error.message).join(", "));
    }
    throw new Error(text || `HTTP ${response.status}`);
  }

  return { success: true, xml: text };
};

export const updateStockItemWithMovement = async ({
  idProduct,
  idProductAttribute = 0,
  deltaQuantity,
  idShop,
}) => {
  const response = await fetch(`${API_URL()}/stock_items?output_format=XML`, {
    method: "POST",
    headers: authHeaders(),
    body: buildStockItemMovementXML({
      idProduct,
      idProductAttribute,
      deltaQuantity,
      idShop,
    }),
  });

  return parseXmlResponseOrThrow(response);
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
