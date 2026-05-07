import {
  parseXML,
  getValue,
  getNumber,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapOrder = (orderNode) => ({
  id: getValue(orderNode.id),
  reference: getValue(orderNode.reference),
  idAddressDelivery: getValue(orderNode.id_address_delivery),
  idAddressInvoice: getValue(orderNode.id_address_invoice),
  idCart: getValue(orderNode.id_cart),
  idCurrency: getValue(orderNode.id_currency),
  idLang: getValue(orderNode.id_lang),
  idCustomer: getValue(orderNode.id_customer),
  idCarrier: getValue(orderNode.id_carrier),
  currentState: getValue(orderNode.current_state),
  secureKey: getValue(orderNode.secure_key),
  payment: getValue(orderNode.payment),
  module: getValue(orderNode.module),
  conversionRate: getNumber(orderNode.conversion_rate),
  recyclable: getBoolean(orderNode.recyclable),
  gift: getBoolean(orderNode.gift),
  giftMessage: getValue(orderNode.gift_message),
  mobileTheme: getBoolean(orderNode.mobile_theme),
  shippingNumber: getValue(orderNode.shipping_number),
  totalDiscounts: getNumber(orderNode.total_discounts),
  totalDiscountsTaxIncl: getNumber(orderNode.total_discounts_tax_incl),
  totalDiscountsTaxExcl: getNumber(orderNode.total_discounts_tax_excl),
  totalPaid: getNumber(orderNode.total_paid),
  totalPaidTaxIncl: getNumber(orderNode.total_paid_tax_incl),
  totalPaidTaxExcl: getNumber(orderNode.total_paid_tax_excl),
  totalPaidReal: getNumber(orderNode.total_paid_real),
  totalProducts: getNumber(orderNode.total_products),
  totalProductsWt: getNumber(orderNode.total_products_wt),
  totalShipping: getNumber(orderNode.total_shipping),
  totalShippingTaxIncl: getNumber(orderNode.total_shipping_tax_incl),
  totalShippingTaxExcl: getNumber(orderNode.total_shipping_tax_excl),
  carrierTaxRate: getNumber(orderNode.carrier_tax_rate),
  totalWrapping: getNumber(orderNode.total_wrapping),
  totalWrappingTaxIncl: getNumber(orderNode.total_wrapping_tax_incl),
  totalWrappingTaxExcl: getNumber(orderNode.total_wrapping_tax_excl),
  roundMode: getInteger(orderNode.round_mode),
  roundType: getInteger(orderNode.round_type),
  invoiceNumber: getInteger(orderNode.invoice_number),
  deliveryNumber: getInteger(orderNode.delivery_number),
  invoiceDate: getValue(orderNode.invoice_date),
  deliveryDate: getValue(orderNode.delivery_date),
  valid: getBoolean(orderNode.valid),
  dateAdd: getValue(orderNode.date_add),
  dateUpd: getValue(orderNode.date_upd),
  note: getValue(orderNode.note),
  associations: {
    orderRows: toArray(orderNode?.associations?.order_rows?.order_row).map(
      (row) => ({
        id: getValue(row.id),
        productId: getValue(row.product_id),
        productAttributeId: getValue(row.product_attribute_id),
        productQuantity: getInteger(row.product_quantity),
        productName: getValue(row.product_name),
        productReference: getValue(row.product_reference),
        productPrice: getNumber(row.product_price),
        unitPriceTaxIncl: getNumber(row.unit_price_tax_incl),
        unitPriceTaxExcl: getNumber(row.unit_price_tax_excl),
        totalPriceTaxIncl: getNumber(row.total_price_tax_incl),
        totalPriceTaxExcl: getNumber(row.total_price_tax_excl),
        idCustomization: getValue(row.id_customization),
        taxRate: getNumber(row.tax_rate),
        ecotax: getNumber(row.ecotax),
      })
    ),
  },
});

export const parseOrder = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order;
  return mapOrder(raw);
};

const parseOrders = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.orders?.order;
  return toArray(raw).map(mapOrder);
};

export default parseOrders;
