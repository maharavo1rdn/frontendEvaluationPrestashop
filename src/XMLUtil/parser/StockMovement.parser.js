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
  idCurrency: getValue(node.id_currency),
  managementType: getValue(node.management_type),
  idEmployee: getValue(node.id_employee),
  idStock: getValue(node.id_stock),
  idStockMvtReason: getValue(node.id_stock_mvt_reason),
  idOrder: getValue(node.id_order),
  idSupplyOrder: getValue(node.id_supply_order),
  productName: getTranslatableValue(node.product_name),
  ean13: getValue(node.ean13),
  upc: getValue(node.upc),
  reference: getValue(node.reference),
  mpn: getValue(node.mpn),
  physicalQuantity: getInteger(node.physical_quantity),
  sign: getInteger(node.sign),
  lastWa: getNumber(node.last_wa),
  currentWa: getNumber(node.current_wa),
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