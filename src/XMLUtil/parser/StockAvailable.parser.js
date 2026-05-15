import { parseXML, getValue, getInteger, getBoolean, toArray } from "./xml.parser";

export const mapStockAvailable = (stockNode) => ({
  id: getValue(stockNode.id),
  idProduct: getValue(stockNode.id_product),
  idProductAttribute: getValue(stockNode.id_product_attribute),
  idShop: getValue(stockNode.id_shop),
  idShopGroup: getValue(stockNode.id_shop_group),
  quantity: getInteger(stockNode.quantity),
  dependsOnStock: getBoolean(stockNode.depends_on_stock),
  outOfStock: getInteger(stockNode.out_of_stock),
  location: getValue(stockNode.location),
});

export const parseStockAvailable = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.stock_available;
  return mapStockAvailable(raw);
};

const parseStockAvailables = (xmlString) => {
  const result = parseXML(xmlString);
  
  const raw = result?.prestashop?.stock_availables?.stock_available;
  return toArray(raw).map(mapStockAvailable);
};

export default parseStockAvailables;
