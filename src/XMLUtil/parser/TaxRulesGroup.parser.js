import {
  parseXML,
  getValue,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapTaxRulesGroup = (groupNode) => ({
  id: getValue(groupNode.id),
  name: getValue(groupNode.name),
  active: getBoolean(groupNode.active),
  deleted: getBoolean(groupNode.deleted),
  dateAdd: getValue(groupNode.date_add),
  dateUpd: getValue(groupNode.date_upd),
});

export const parseTaxRulesGroup = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.tax_rules_group;
  return mapTaxRulesGroup(raw);
};

const parseTaxRulesGroups = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.tax_rules_groups?.tax_rules_group;
  return toArray(raw).map(mapTaxRulesGroup);
};

export default parseTaxRulesGroups;
