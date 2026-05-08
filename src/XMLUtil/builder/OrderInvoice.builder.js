import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildOrderInvoiceXML = (invoice) => {
  const inner = `
  <order_invoice>
    ${invoice.id ? field("id", invoice.id) : "<!-- POST : pas d'id -->"}

    ${field("id_order", invoice.idOrder ?? 0)}
    ${optionalField("number", invoice.number)}
    ${optionalField("delivery_number", invoice.deliveryNumber)}
    ${optionalField("delivery_date", invoice.deliveryDate)}
    ${optionalField("note", invoice.note)}
    ${optionalField("total_discount_tax_excl", invoice.totalDiscountTaxExcl)}
    ${optionalField("total_discount_tax_incl", invoice.totalDiscountTaxIncl)}
    ${optionalField("total_paid_tax_excl", invoice.totalPaidTaxExcl)}
    ${optionalField("total_paid_tax_incl", invoice.totalPaidTaxIncl)}
    ${optionalField("total_products", invoice.totalProducts)}
    ${optionalField("total_products_wt", invoice.totalProductsWt)}
    ${optionalField("total_shipping_tax_excl", invoice.totalShippingTaxExcl)}
    ${optionalField("total_shipping_tax_incl", invoice.totalShippingTaxIncl)}
    ${optionalField("total_wrapping_tax_excl", invoice.totalWrappingTaxExcl)}
    ${optionalField("total_wrapping_tax_incl", invoice.totalWrappingTaxIncl)}
    ${optionalField("shop_address", invoice.shopAddress)}
  </order_invoice>`;

  return wrapPrestashop(inner);
};
