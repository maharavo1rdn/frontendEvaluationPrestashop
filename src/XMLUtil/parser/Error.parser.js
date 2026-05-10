import { parseXML, getValue, getBoolean, toArray } from "./xml.parser";

export const mapError = (errorNode) => ({
  code: getValue(errorNode.code),
  message: getValue(errorNode.message)
});

export const parseError = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.error;
  return mapError(raw);
};

const parseErrors = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.errors?.error;
  return toArray(raw).map(mapError);
};

export default parseErrors;
