import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildOrderCarrierXML = (carrier) => {
  const inner = `
  <order_carrier>
    ${carrier.id ? field("id", carrier.id) : "<!-- POST : pas d'id -->"}

    ${field("id_order", carrier.idOrder ?? 0)}
    ${field("id_carrier", carrier.idCarrier ?? 0)}
    ${optionalField("id_order_invoice", carrier.idOrderInvoice)}
    ${optionalField("weight", carrier.weight)}
    ${optionalField("shipping_cost_tax_excl", carrier.shippingCostTaxExcl)}
    ${optionalField("shipping_cost_tax_incl", carrier.shippingCostTaxIncl)}
    ${optionalField("tracking_number", carrier.trackingNumber)}
  </order_carrier>`;

  return wrapPrestashop(inner);
};
