import {
  parseXML,
  getValue,
  getTranslatableValue,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapProductFeatureValue = (valueNode) => ({
  id: getValue(valueNode.id),
  idFeature: getValue(valueNode.id_feature),
  custom: getBoolean(valueNode.custom),
  value: getTranslatableValue(valueNode.value),
});

export const parseProductFeatureValue = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product_feature_value;
  return mapProductFeatureValue(raw);
};

const parseProductFeatureValues = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.product_feature_values?.product_feature_value;
  return toArray(raw).map(mapProductFeatureValue);
};

export default parseProductFeatureValues;
