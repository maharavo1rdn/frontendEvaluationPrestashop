import {
  parseXML,
  getValue,
  getInteger,
  toArray,
} from "./xml.parser";

export const mapTaxRule = (ruleNode) => ({
  id: getValue(ruleNode.id),
  taxRulesGroupId: getValue(ruleNode.id_tax_rules_group),
  taxId: getValue(ruleNode.id_tax),
  countryId: getValue(ruleNode.id_country),
  stateId: getValue(ruleNode.id_state),
  zipcodeFrom: getValue(ruleNode.zipcode_from),
  zipcodeTo: getValue(ruleNode.zipcode_to),
  behavior: getInteger(ruleNode.behavior),
  description: getValue(ruleNode.description),
});

export const parseTaxRule = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.tax_rule;
  return mapTaxRule(raw);
};

const parseTaxRules = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.tax_rules?.tax_rule;
  return toArray(raw).map(mapTaxRule);
};

export default parseTaxRules;
