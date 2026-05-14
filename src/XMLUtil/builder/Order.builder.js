import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (value === "0" || value === 0 || value === false) return 0; // Force 0 pour ces cas
  return 1;
};


const buildOrderRows = (rows = []) => {
  if (!rows.length) return "";
  return `
    <order_rows>
      ${rows
        .map(
          (row) => `<order_row>
        ${optionalField("id", row.id)}
        ${optionalField("product_id", row.productId)}
        ${optionalField("product_attribute_id", row.productAttributeId)}
        ${optionalField("product_quantity", row.productQuantity)}
        ${optionalField("product_name", row.productName)}
        ${optionalField("product_reference", row.productReference)}
        ${optionalField("product_price", row.productPrice ?? row.unitPriceTaxExcl)}
        ${optionalField("unit_price_tax_incl", row.unitPriceTaxIncl)}
        ${optionalField("unit_price_tax_excl", row.unitPriceTaxExcl)}
        ${optionalField("total_price_tax_incl", row.totalPriceTaxIncl)}
        ${optionalField("total_price_tax_excl", row.totalPriceTaxExcl)}
        ${optionalField("tax_rate", row.taxRate)}
        ${optionalField("id_customization", row.idCustomization)}
      </order_row>`
        )
        .join("\n      ")}
    </order_rows>`;
};

const buildAssociations = (associations = {}) => {
  const { orderRows = [] } = associations;
  const blocks = [buildOrderRows(orderRows)].filter(Boolean).join("");
  if (!blocks) return "";

  return `
  <associations>
    ${blocks}
  </associations>`;
};

export const buildOrderXML = (order) => {
  const inner = `
  <order>
    ${order.id ? field("id", order.id) : "<!-- POST : pas d'id -->"}

    ${field("id_address_delivery", order.idAddressDelivery ?? 0)}
    ${field("id_address_invoice", order.idAddressInvoice ?? 0)}
    ${field("id_cart", order.idCart ?? 0)}
    ${field("id_currency", order.idCurrency ?? 0)}
    ${field("id_lang", order.idLang ?? 1)}
    ${field("id_customer", order.idCustomer ?? 0)}
    ${field("id_carrier", order.idCarrier ?? 2)}
    ${field("id_shop", order.idShop ?? 1)}
    
    ${field("current_state", order.currentState)}
    ${optionalField("secure_key", order.secureKey)}
    ${optionalField("date_add", order.dateAdd)}
    ${optionalField("payment", order.payment)}
    ${optionalField("module", order.module)}
    ${optionalField("conversion_rate", order.conversionRate)}
    ${optionalField("recyclable", boolValue(order.recyclable))}
    ${optionalField("gift", boolValue(order.gift))}
    ${optionalField("gift_message", order.giftMessage)}
    ${optionalField("mobile_theme", boolValue(order.mobileTheme))}
    ${optionalField("shipping_number", order.shippingNumber)}
    ${optionalField("total_discounts", order.totalDiscounts)}
    ${optionalField("total_discounts_tax_incl", order.totalDiscountsTaxIncl)}
    ${optionalField("total_discounts_tax_excl", order.totalDiscountsTaxExcl)}
    ${optionalField("total_paid", order.totalPaid)}
    ${optionalField("total_paid_tax_incl", order.totalPaidTaxIncl)}
    ${optionalField("total_paid_tax_excl", order.totalPaidTaxExcl)}
    ${optionalField("total_paid_real", order.totalPaidReal)}
    ${optionalField("total_products", order.totalProducts)}
    ${optionalField("total_products_wt", order.totalProductsWt)}
    ${optionalField("total_shipping", order.totalShipping)}
    ${optionalField("total_shipping_tax_incl", order.totalShippingTaxIncl)}
    ${optionalField("total_shipping_tax_excl", order.totalShippingTaxExcl)}
    ${optionalField("carrier_tax_rate", order.carrierTaxRate)}
    ${optionalField("total_wrapping", order.totalWrapping)}
    ${optionalField("total_wrapping_tax_incl", order.totalWrappingTaxIncl)}
    ${optionalField("total_wrapping_tax_excl", order.totalWrappingTaxExcl)}
    ${optionalField("round_mode", order.roundMode)}
    ${optionalField("round_type", order.roundType)}
    ${optionalField("invoice_number", order.invoiceNumber)}
    ${optionalField("delivery_number", order.deliveryNumber)}
    ${optionalField("invoice_date", order.dateAdd)}
    ${optionalField("delivery_date", order.dateAdd)}
    ${optionalField("valid", boolValue(order.valid))}
    ${optionalField("note", order.note)}

    ${buildAssociations(order.associations)}
  </order>`;

  return wrapPrestashop(inner);
};
