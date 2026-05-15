// src/XMLUtil/parser/StockMovement.parser.js
import {
  parseXML,
  getValue,
  getInteger,
  getNumber,
  toArray,
  getTranslatableValue,
} from "./xml.parser";

export const mapStockMovement = (node) => ({
  id: getValue(node.id),
  idProduct: getValue(node.id_product),
  idProductAttribute: getValue(node.id_product_attribute),
  idWarehouse: getValue(node.id_warehouse),
  idStock: getValue(node.id_stock), // Lien vers stock_available
  idReason: getValue(node.id_stock_mvt_reason),
  idEmployee: getValue(node.id_employee),
  productName: getTranslatableValue(node.product_name),
  reference: getValue(node.reference),
  quantity: getInteger(node.physical_quantity),
  sign: getInteger(node.sign), // 1 pour ajout, -1 pour retrait
  priceTe: getNumber(node.price_te),
  dateAdd: getValue(node.date_add),
});

export const parseStockMovement = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.stock_mvt;
  return mapStockMovement(raw);
};

const parseStockMovements = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.stock_mvts?.stock_mvt;
  return toArray(raw).map(mapStockMovement);
};

export default parseStockMovements;