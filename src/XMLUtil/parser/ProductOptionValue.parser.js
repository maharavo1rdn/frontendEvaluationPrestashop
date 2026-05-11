import {
  parseXML,
  getValue,
  getTranslatableValue,
  toArray,
} from "./xml.parser";

export const mapProductOptionValue = (productOptionValueNode) => ({
  id: getValue(productOptionValueNode.id),
  idAttribute: getValue(productOptionValueNode.id_attribute),
  name: getTranslatableValue(productOptionValueNode.name),
  dateAdd: getValue(productOptionValueNode.date_add),
  dateUpd: getValue(productOptionValueNode.date_upd),
});

export const parseProductOptionValue = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product_option_value;
  return mapProductOptionValue(raw);
};

const parseProductOptionValues = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product_option_values?.product_option_value;
  return toArray(raw).map(mapProductOptionValue);
};

export default parseProductOptionValues;
