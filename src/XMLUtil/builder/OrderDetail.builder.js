import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildOrderDetailXML = (detail) => {
  const inner = `
  <order_detail>
    ${detail.id ? field("id", detail.id) : "<!-- POST : pas d'id -->"}

    ${field("id_order", detail.idOrder ?? 0)}
    ${field("product_id", detail.productId ?? 0)}
    ${optionalField("product_attribute_id", detail.productAttributeId)}
    ${field("product_name", detail.productName ?? "")}
    ${field("product_quantity", detail.productQuantity ?? 1)}

    ${optionalField("product_reference", detail.productReference)}
    ${optionalField("product_ean13", detail.productEan13)}
    ${optionalField("product_isbn", detail.productIsbn)}
    ${optionalField("product_upc", detail.productUpc)}
    ${optionalField("product_mpn", detail.productMpn)}
    ${optionalField("product_price", detail.productPrice)}
    ${optionalField("unit_price_tax_incl", detail.unitPriceTaxIncl)}
    ${optionalField("unit_price_tax_excl", detail.unitPriceTaxExcl)}
    ${optionalField("total_price_tax_incl", detail.totalPriceTaxIncl)}
    ${optionalField("total_price_tax_excl", detail.totalPriceTaxExcl)}
    ${optionalField("total_shipping_price_tax_incl", detail.totalShippingPriceTaxIncl)}
    ${optionalField("total_shipping_price_tax_excl", detail.totalShippingPriceTaxExcl)}
    ${optionalField("reduction_percent", detail.reductionPercent)}
    ${optionalField("reduction_amount", detail.reductionAmount)}
    ${optionalField("reduction_amount_tax_incl", detail.reductionAmountTaxIncl)}
    ${optionalField("reduction_amount_tax_excl", detail.reductionAmountTaxExcl)}
    ${optionalField("group_reduction", detail.groupReduction)}
    ${optionalField("ecotax", detail.ecotax)}
    ${optionalField("tax_computation_method", detail.taxComputationMethod)}
    ${optionalField("tax_name", detail.taxName)}
    ${optionalField("tax_rate", detail.taxRate)}
    ${optionalField("id_customization", detail.idCustomization)}
    ${optionalField("download_hash", detail.downloadHash)}
    ${optionalField("download_deadline", detail.downloadDeadline)}
    ${optionalField("product_quantity_in_stock", detail.productQuantityInStock)}
    ${optionalField("product_quantity_refunded", detail.productQuantityRefunded)}
    ${optionalField("product_quantity_return", detail.productQuantityReturn)}
    ${optionalField("product_quantity_reinjected", detail.productQuantityReinjected)}
    ${optionalField("total_refunded_tax_excl", detail.totalRefundedTaxExcl)}
    ${optionalField("total_refunded_tax_incl", detail.totalRefundedTaxIncl)}
    ${optionalField("total_return_tax_excl", detail.totalReturnTaxExcl)}
    ${optionalField("total_return_tax_incl", detail.totalReturnTaxIncl)}
    ${optionalField("total_shipping_tax_excl", detail.totalShippingTaxExcl)}
    ${optionalField("total_shipping_tax_incl", detail.totalShippingTaxIncl)}
    ${optionalField("is_gift", boolValue(detail.isGift))}
  </order_detail>`;

  return wrapPrestashop(inner);
};
