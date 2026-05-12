import {
  parseXML,
  getValue,
  getTranslatableValue,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

const toIdArray = (nodes) => toArray(nodes).map((node) => getValue(node.id));

export const mapProductOption = (productOptionNode) => ({
  id: getValue(productOptionNode.id),
  isColorGroup: getBoolean(productOptionNode.is_color_group),
  groupType: getValue(productOptionNode.group_type),
  position: getInteger(productOptionNode.position),
  name: getTranslatableValue(productOptionNode.name),
  publicName: getTranslatableValue(productOptionNode.public_name),
  dateAdd: getValue(productOptionNode.date_add),
  dateUpd: getValue(productOptionNode.date_upd),
  associations: {
    productOptionValues: toIdArray(
      productOptionNode?.associations?.product_option_values?.product_option_value
    ),
  },
});

export const parseProductOption = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product_option;
  return mapProductOption(raw);
};

const parseProductOptions = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product_options?.product_option;
  return toArray(raw).map(mapProductOption);
};

export default parseProductOptions;
