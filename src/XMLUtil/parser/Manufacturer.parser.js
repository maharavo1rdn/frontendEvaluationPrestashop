import {
  parseXML,
  getValue,
  getTranslatableValue,
  getBoolean,
  toArray,
} from "./xml.parser";

const toIdArray = (nodes) => toArray(nodes).map((node) => getValue(node.id));

export const mapManufacturer = (manufacturerNode) => ({
  id: getValue(manufacturerNode.id),
  name: getValue(manufacturerNode.name),
  active: getBoolean(manufacturerNode.active),
  dateAdd: getValue(manufacturerNode.date_add),
  dateUpd: getValue(manufacturerNode.date_upd),
  description: getTranslatableValue(manufacturerNode.description),
  shortDescription: getTranslatableValue(manufacturerNode.short_description),
  metaTitle: getTranslatableValue(manufacturerNode.meta_title),
  metaDescription: getTranslatableValue(manufacturerNode.meta_description),
  metaKeywords: getTranslatableValue(manufacturerNode.meta_keywords),
  linkRewrite: getTranslatableValue(manufacturerNode.link_rewrite),
  associations: {
    addresses: toIdArray(manufacturerNode?.associations?.addresses?.address),
  },
});

export const parseManufacturer = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.manufacturer;
  return mapManufacturer(raw);
};

const parseManufacturers = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.manufacturers?.manufacturer;
  return toArray(raw).map(mapManufacturer);
};

export default parseManufacturers;
