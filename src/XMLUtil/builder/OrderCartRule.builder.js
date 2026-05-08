import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildOrderCartRuleXML = (rule) => {
  const inner = `
  <order_cart_rule>
    ${rule.id ? field("id", rule.id) : "<!-- POST : pas d'id -->"}

    ${field("id_order", rule.idOrder ?? 0)}
    ${field("id_cart_rule", rule.idCartRule ?? 0)}
    ${optionalField("id_order_invoice", rule.idOrderInvoice)}
    ${field("name", rule.name ?? "")}
    ${field("value", rule.value ?? 0)}
    ${optionalField("value_tax_incl", rule.valueTaxIncl)}
    ${optionalField("free_shipping", boolValue(rule.freeShipping))}
    ${optionalField("deleted", boolValue(rule.deleted))}
  </order_cart_rule>`;

  return wrapPrestashop(inner);
};
