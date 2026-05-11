import { field, langField, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildTaxXML = (tax) => {
  const inner = `
  <tax>
    ${tax.id ? field("id", tax.id) : "<!-- POST : pas d'id -->"}

    ${langField("name", tax.name ?? "")}
    ${field("rate", tax.rate ?? 0)}
    ${field("active", boolValue(tax.active ?? true) ?? 1)}
    ${optionalField("deleted", boolValue(tax.deleted))}
  </tax>`;

  return wrapPrestashop(inner);
};
