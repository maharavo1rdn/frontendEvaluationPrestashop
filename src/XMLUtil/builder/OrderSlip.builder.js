import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildOrderSlipXML = (slip) => {
  const inner = `
  <order_slip>
    ${slip.id ? field("id", slip.id) : "<!-- POST : pas d'id -->"}

    ${field("id_order", slip.idOrder ?? 0)}
    ${optionalField("conversion_rate", slip.conversionRate)}
    ${optionalField("amount", slip.amount)}
    ${optionalField("shipping_cost", slip.shippingCost)}
    ${optionalField("amount_tax_incl", slip.amountTaxIncl)}
    ${optionalField("amount_tax_excl", slip.amountTaxExcl)}
    ${optionalField("shipping_cost_tax_incl", slip.shippingCostTaxIncl)}
    ${optionalField("shipping_cost_tax_excl", slip.shippingCostTaxExcl)}
  </order_slip>`;

  return wrapPrestashop(inner);
};
