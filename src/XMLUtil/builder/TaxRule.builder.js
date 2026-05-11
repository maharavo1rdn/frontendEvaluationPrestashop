import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildTaxRuleXML = (taxRule) => {
  const inner = `
  <tax_rule>
    ${taxRule.id ? field("id", taxRule.id) : "<!-- POST : pas d'id -->"}

    ${field("id_tax_rules_group", taxRule.taxRulesGroupId)}
    ${field("id_tax", taxRule.taxId)}
    ${field("id_country", taxRule.countryId ?? 0)}
    ${field("id_state", taxRule.stateId ?? 0)}
    ${field("zipcode_from", taxRule.zipcodeFrom ?? 0)}
    ${field("zipcode_to", taxRule.zipcodeTo ?? 0)}
    ${field("behavior", taxRule.behavior ?? 0)}
    ${optionalField("description", taxRule.description)}
  </tax_rule>`;

  return wrapPrestashop(inner);
};
