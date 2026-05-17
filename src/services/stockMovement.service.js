import parseStockMovements, {
  parseStockMovement,
} from "../XMLUtil/parser/StockMovement.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildStockMvtXML } from "../XMLUtil/builder/StockMovement.builder";
import { API_URL, authHeaders } from "../config/config.service";
const DEFAULT_EMPLOYEE_ID = 1;

export const findStockMovementsByStockAvailables = async (stockAvailables) => {
  if (!stockAvailables || stockAvailables.length === 0) return [];

  const stockIds = stockAvailables.map((s) => s.id).join("|");

  try {
    const response = await fetch(
      `${API_URL()}/stock_movements?filter[id_stock]=[${stockIds}]&display=full`,
      { headers: authHeaders() }
    );

    if (!response.ok) return [];
    const xmlText = await response.text();
    return parseStockMovements(xmlText);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return [];
  }
};

export const getStockMovements = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      params.append(`filter[${key}]`, `[${value}]`);
    }
    params.append("display", "full");
    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");
    const response = await fetch(
      `${API_URL()}/stock_movements?${queryString}`,
      {
        headers: authHeaders(),
      }
    );
    if (!response.ok) {
      const text = await response.text();

      const errors = parseErrors(text);
      console.error("ici",error);

      throw new Error(
        errors.length
          ? errors.map((e) => e.message).join(", ")
          : `HTTP ${response.status}`
      );
    }
    const xml = await response.text();
    return parseStockMovements(xml);
  } catch (error) {
    throw error;
  }
};

export const getStockMovementsByProduct = async (
  productId,
  productAttributeId = 0
) => {
  return getStockMovements({
    id_product: productId,
    id_product_attribute: productAttributeId,
  });
};

export const getStockMovementById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/stock_movements/${id}?output_format=XML`,
      {
        headers: authHeaders(),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} - ${text}`);
    }
    const xml = await response.text();
    return parseStockMovement(xml);
  } catch (error) {
    throw error;
  }
};

export const updateStockMovement = async (id, mvt) => {
  const xml = buildStockMvtXML({ ...mvt, id });
  try {
    const response = await fetch(`${API_URL()}/stock_movements/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: xml,
    });
    const responseXml = await response.text();
    if (!response.ok) {
      const errors = parseErrors(responseXml);
      throw new Error(
        errors.length
          ? errors.map((e) => e.message).join(", ")
          : `HTTP ${response.status} - ${responseXml}`
      );
    }
    return { success: true, id };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
export const postStockMovement = async (mvt) => {
  const payload = {
    ...mvt,
    idEmployee: mvt.idEmployee || DEFAULT_EMPLOYEE_ID,
    dateAdd: mvt.dateAdd,
  };
  const xml = buildStockMvtXML(payload);
  try {
    const response = await fetch(
      `${API_URL()}/stock_movements?output_format=XML`,
      {
        method: "POST",
        headers: authHeaders(),
        body: xml,
      }
    );
    const responseXml = await response.text();
    if (!response.ok) {
      const errors = parseErrors(responseXml);
      throw new Error(
        errors.length
          ? errors.map((e) => e.message).join(", ")
          : `HTTP ${response.status} - ${responseXml}`
      );
    }
    const created = parseStockMovement(responseXml);
    if (mvt.dateAdd) {
      const fullMovement = await getStockMovementById(created.id);
      if (fullMovement) {
        await updateStockMovement(created.id, {
          ...fullMovement,
          dateAdd: mvt.dateAdd
        });
      }
    }
    return { success: true, id: created.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const createStockAdjustmentMovement = async ({
  idProduct,
  idProductAttribute = 0,
  idStock,
  deltaQuantity,
  priceTe = 0,
  dateAdd,
}) => {
  const isPositive = deltaQuantity >= 0;
  const idReason = isPositive ? 1 : 2;
  const sign = isPositive ? 1 : -1;
  const physicalQuantity = Math.abs(deltaQuantity);

  return postStockMovement({
    idProduct,
    idProductAttribute,
    idStock,
    idStockMvtReason: idReason,
    physicalQuantity,
    sign,
    priceTe,
    dateAdd,
  });
};
