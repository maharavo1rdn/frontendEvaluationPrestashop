import {
  parseXML,
  getValue,
  getNumber,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapOrderDetail = (detailNode) => ({
  id: getValue(detailNode.id),
  idOrder: getValue(detailNode.id_order),
  productId: getValue(detailNode.product_id),
  productAttributeId: getValue(detailNode.product_attribute_id),
  productName: getValue(detailNode.product_name),
  productQuantity: getInteger(detailNode.product_quantity),
  productReference: getValue(detailNode.product_reference),
  productEan13: getValue(detailNode.product_ean13),
  productIsbn: getValue(detailNode.product_isbn),
  productUpc: getValue(detailNode.product_upc),
  productMpn: getValue(detailNode.product_mpn),
  productPrice: getNumber(detailNode.product_price),
  unitPriceTaxIncl: getNumber(detailNode.unit_price_tax_incl),
  unitPriceTaxExcl: getNumber(detailNode.unit_price_tax_excl),
  totalPriceTaxIncl: getNumber(detailNode.total_price_tax_incl),
  totalPriceTaxExcl: getNumber(detailNode.total_price_tax_excl),
  totalShippingPriceTaxIncl: getNumber(detailNode.total_shipping_price_tax_incl),
  totalShippingPriceTaxExcl: getNumber(detailNode.total_shipping_price_tax_excl),
  reductionPercent: getNumber(detailNode.reduction_percent),
  reductionAmount: getNumber(detailNode.reduction_amount),
  reductionAmountTaxIncl: getNumber(detailNode.reduction_amount_tax_incl),
  reductionAmountTaxExcl: getNumber(detailNode.reduction_amount_tax_excl),
  groupReduction: getNumber(detailNode.group_reduction),
  ecotax: getNumber(detailNode.ecotax),
  taxComputationMethod: getInteger(detailNode.tax_computation_method),
  taxName: getValue(detailNode.tax_name),
  taxRate: getNumber(detailNode.tax_rate),
  idCustomization: getValue(detailNode.id_customization),
  downloadHash: getValue(detailNode.download_hash),
  downloadDeadline: getValue(detailNode.download_deadline),
  productQuantityInStock: getInteger(detailNode.product_quantity_in_stock),
  productQuantityRefunded: getInteger(detailNode.product_quantity_refunded),
  productQuantityReturn: getInteger(detailNode.product_quantity_return),
  productQuantityReinjected: getInteger(detailNode.product_quantity_reinjected),
  totalRefundedTaxExcl: getNumber(detailNode.total_refunded_tax_excl),
  totalRefundedTaxIncl: getNumber(detailNode.total_refunded_tax_incl),
  totalReturnTaxExcl: getNumber(detailNode.total_return_tax_excl),
  totalReturnTaxIncl: getNumber(detailNode.total_return_tax_incl),
  totalShippingTaxExcl: getNumber(detailNode.total_shipping_tax_excl),
  totalShippingTaxIncl: getNumber(detailNode.total_shipping_tax_incl),
  isGift: getBoolean(detailNode.is_gift),
});

export const parseOrderDetail = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_detail;
  return mapOrderDetail(raw);
};

const parseOrderDetails = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_details?.order_detail;
  return toArray(raw).map(mapOrderDetail);
};

export default parseOrderDetails;
