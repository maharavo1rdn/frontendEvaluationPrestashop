import { parseXML, getValue, getNumber, getInteger, toArray } from "./xml.parser";

export const mapOrderInvoice = (invoiceNode) => ({
  id: getValue(invoiceNode.id),
  idOrder: getValue(invoiceNode.id_order),
  number: getInteger(invoiceNode.number),
  deliveryNumber: getInteger(invoiceNode.delivery_number),
  deliveryDate: getValue(invoiceNode.delivery_date),
  note: getValue(invoiceNode.note),
  totalDiscountTaxExcl: getNumber(invoiceNode.total_discount_tax_excl),
  totalDiscountTaxIncl: getNumber(invoiceNode.total_discount_tax_incl),
  totalPaidTaxExcl: getNumber(invoiceNode.total_paid_tax_excl),
  totalPaidTaxIncl: getNumber(invoiceNode.total_paid_tax_incl),
  totalProducts: getNumber(invoiceNode.total_products),
  totalProductsWt: getNumber(invoiceNode.total_products_wt),
  totalShippingTaxExcl: getNumber(invoiceNode.total_shipping_tax_excl),
  totalShippingTaxIncl: getNumber(invoiceNode.total_shipping_tax_incl),
  totalWrappingTaxExcl: getNumber(invoiceNode.total_wrapping_tax_excl),
  totalWrappingTaxIncl: getNumber(invoiceNode.total_wrapping_tax_incl),
  shopAddress: getValue(invoiceNode.shop_address),
  dateAdd: getValue(invoiceNode.date_add),
});

export const parseOrderInvoice = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_invoice;
  return mapOrderInvoice(raw);
};

const parseOrderInvoices = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_invoices?.order_invoice;
  return toArray(raw).map(mapOrderInvoice);
};

export default parseOrderInvoices;
