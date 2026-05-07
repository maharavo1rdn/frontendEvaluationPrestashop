import {
  parseXML,
  getValue,
  getTranslatableValue,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

const toIdArray = (nodes) => toArray(nodes).map((node) => getValue(node.id));

export const mapCategory = (categoryNode) => ({
  id: getValue(categoryNode.id),
  idParent: getValue(categoryNode.id_parent),
  idShopDefault: getValue(categoryNode.id_shop_default),
  levelDepth: getInteger(categoryNode.level_depth),
  active: getBoolean(categoryNode.active),
  position: getInteger(categoryNode.position),
  isRootCategory: getBoolean(categoryNode.is_root_category),
  name: getTranslatableValue(categoryNode.name),
  description: getTranslatableValue(categoryNode.description),
  linkRewrite: getTranslatableValue(categoryNode.link_rewrite),
  metaTitle: getTranslatableValue(categoryNode.meta_title),
  metaDescription: getTranslatableValue(categoryNode.meta_description),
  metaKeywords: getTranslatableValue(categoryNode.meta_keywords),
  dateAdd: getValue(categoryNode.date_add),
  dateUpd: getValue(categoryNode.date_upd),
  associations: {
    categories: toIdArray(categoryNode?.associations?.categories?.category),
    products: toIdArray(categoryNode?.associations?.products?.product),
  },
});

export const parseCategory = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.category;
  return mapCategory(raw);
};

const parseCategories = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.categories?.category;
  return toArray(raw).map(mapCategory);
};

export default parseCategories;
