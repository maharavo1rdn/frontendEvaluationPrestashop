import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildTaxRulesGroupXML = (group) => {
  const inner = `
  <tax_rules_group>
    ${group.id ? field("id", group.id) : "<!-- POST : pas d'id -->"}

    ${field("name", group.name ?? "")}
    ${field("active", boolValue(group.active ?? true) ?? 1)}
    ${optionalField("deleted", boolValue(group.deleted))}
  </tax_rules_group>`;

  return wrapPrestashop(inner);
};
