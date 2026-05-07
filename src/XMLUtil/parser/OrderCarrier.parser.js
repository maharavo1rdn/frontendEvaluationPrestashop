import { parseXML, getValue, getNumber, toArray } from "./xml.parser";

export const mapOrderCarrier = (carrierNode) => ({
  id: getValue(carrierNode.id),
  idOrder: getValue(carrierNode.id_order),
  idCarrier: getValue(carrierNode.id_carrier),
  idOrderInvoice: getValue(carrierNode.id_order_invoice),
  weight: getNumber(carrierNode.weight),
  shippingCostTaxExcl: getNumber(carrierNode.shipping_cost_tax_excl),
  shippingCostTaxIncl: getNumber(carrierNode.shipping_cost_tax_incl),
  trackingNumber: getValue(carrierNode.tracking_number),
  dateAdd: getValue(carrierNode.date_add),
});

export const parseOrderCarrier = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_carrier;
  return mapOrderCarrier(raw);
};

const parseOrderCarriers = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_carriers?.order_carrier;
  return toArray(raw).map(mapOrderCarrier);
};

export default parseOrderCarriers;
