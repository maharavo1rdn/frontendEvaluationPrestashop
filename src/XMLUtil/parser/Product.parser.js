import {
  parseXML,
  getValue,
  getTranslatableValue,
  getNumber,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

const toIdArray = (nodes) => toArray(nodes).map((node) => getValue(node.id));

export const mapProduct = (productNode) => ({
  id: getValue(productNode.id),
  type: getValue(productNode.type),
  reference: getValue(productNode.reference),
  supplierReference: getValue(productNode.supplier_reference),
  idManufacturer: getValue(productNode.id_manufacturer),
  idSupplier: getValue(productNode.id_supplier),
  idCategoryDefault: getValue(productNode.id_category_default),
  idTaxRulesGroup: getValue(productNode.id_tax_rules_group),
  idShopDefault: getValue(productNode.id_shop_default),
  location: getValue(productNode.location),
  width: getNumber(productNode.width),
  height: getNumber(productNode.height),
  depth: getNumber(productNode.depth),
  weight: getNumber(productNode.weight),
  price: getNumber(productNode.price),
  wholesalePrice: getNumber(productNode.wholesale_price),
  ecotax: getNumber(productNode.ecotax),
  minimalQuantity: getInteger(productNode.minimal_quantity),
  lowStockThreshold: getInteger(productNode.low_stock_threshold),
  lowStockAlert: getBoolean(productNode.low_stock_alert),
  availableForOrder: getBoolean(productNode.available_for_order),
  showPrice: getBoolean(productNode.show_price),
  onlineOnly: getBoolean(productNode.online_only),
  onSale: getBoolean(productNode.on_sale),
  condition: getValue(productNode.condition),
  visibility: getValue(productNode.visibility),
  active: getBoolean(productNode.active),
  name: getTranslatableValue(productNode.name),
  descriptionShort: getTranslatableValue(productNode.description_short),
  description: getTranslatableValue(productNode.description),
  linkRewrite: getTranslatableValue(productNode.link_rewrite),
  metaTitle: getTranslatableValue(productNode.meta_title),
  metaDescription: getTranslatableValue(productNode.meta_description),
  metaKeywords: getTranslatableValue(productNode.meta_keywords),
  availableNow: getTranslatableValue(productNode.available_now),
  availableLater: getTranslatableValue(productNode.available_later),
  dateAdd: getValue(productNode.date_add),
  dateUpd: getValue(productNode.date_upd),
  associations: {
    categories: toIdArray(productNode?.associations?.categories?.category),
    images: toIdArray(productNode?.associations?.images?.image),
    combinations: toIdArray(productNode?.associations?.combinations?.combination),
    productFeatures: toArray(
      productNode?.associations?.product_features?.product_feature
    ).map((feature) => ({
      id: getValue(feature.id),
      idFeatureValue: getValue(feature.id_feature_value),
    })),
    stockAvailables: toArray(
      productNode?.associations?.stock_availables?.stock_available
    ).map((stock) => ({
      id: getValue(stock.id),
      idProductAttribute: getValue(stock.id_product_attribute),
    })),
    tags: toIdArray(productNode?.associations?.tags?.tag),
  },
});


export const parseProduct = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product;
  return mapProduct(raw);
};

const parseProducts = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.products?.product;
  return toArray(raw).map(mapProduct);
};

export default parseProducts;
