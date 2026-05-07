import { parseXML, getValue, getNumber, getBoolean, toArray } from "./xml.parser";

export const mapOrderCartRule = (ruleNode) => ({
  id: getValue(ruleNode.id),
  idOrder: getValue(ruleNode.id_order),
  idCartRule: getValue(ruleNode.id_cart_rule),
  idOrderInvoice: getValue(ruleNode.id_order_invoice),
  name: getValue(ruleNode.name),
  value: getNumber(ruleNode.value),
  valueTaxIncl: getNumber(ruleNode.value_tax_incl),
  freeShipping: getBoolean(ruleNode.free_shipping),
  deleted: getBoolean(ruleNode.deleted),
});

export const parseOrderCartRule = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_cart_rule;
  return mapOrderCartRule(raw);
};

const parseOrderCartRules = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_cart_rules?.order_cart_rule;
  return toArray(raw).map(mapOrderCartRule);
};

export default parseOrderCartRules;
