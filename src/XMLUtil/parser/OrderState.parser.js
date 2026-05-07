import {
  parseXML,
  getValue,
  getTranslatableValue,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapOrderState = (stateNode) => ({
  id: getValue(stateNode.id),
  name: getTranslatableValue(stateNode.name),
  color: getValue(stateNode.color),
  sendEmail: getBoolean(stateNode.send_email),
  moduleName: getValue(stateNode.module_name),
  invoice: getBoolean(stateNode.invoice),
  delivery: getBoolean(stateNode.delivery),
  logable: getBoolean(stateNode.logable),
  shipped: getBoolean(stateNode.shipped),
  paid: getBoolean(stateNode.paid),
  pdfInvoice: getBoolean(stateNode.pdf_invoice),
  pdfDelivery: getBoolean(stateNode.pdf_delivery),
  deleted: getBoolean(stateNode.deleted),
  hidden: getBoolean(stateNode.hidden),
});

export const parseOrderState = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_state;
  return mapOrderState(raw);
};

const parseOrderStates = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_states?.order_state;
  return toArray(raw).map(mapOrderState);
};

export default parseOrderStates;
