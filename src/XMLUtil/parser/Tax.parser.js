import {
  parseXML,
  getValue,
  getNumber,
  getBoolean,
  toArray,
  getTranslatableValue,
} from "./xml.parser";

export const mapTax = (taxNode) => ({
  id: getValue(taxNode.id),
  name: getTranslatableValue(taxNode.name),
  rate: getNumber(taxNode.rate),
  active: getBoolean(taxNode.active),
  deleted: getBoolean(taxNode.deleted),
});

export const parseTax = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.tax;
  return mapTax(raw);
};

const parseTaxes = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.taxes?.tax;
  return toArray(raw).map(mapTax);
};

export default parseTaxes;
