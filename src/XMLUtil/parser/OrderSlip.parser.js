import { parseXML, getValue, getNumber, toArray } from "./xml.parser";

export const mapOrderSlip = (slipNode) => ({
  id: getValue(slipNode.id),
  idOrder: getValue(slipNode.id_order),
  conversionRate: getNumber(slipNode.conversion_rate),
  amount: getNumber(slipNode.amount),
  shippingCost: getNumber(slipNode.shipping_cost),
  amountTaxIncl: getNumber(slipNode.amount_tax_incl),
  amountTaxExcl: getNumber(slipNode.amount_tax_excl),
  shippingCostTaxIncl: getNumber(slipNode.shipping_cost_tax_incl),
  shippingCostTaxExcl: getNumber(slipNode.shipping_cost_tax_excl),
  dateAdd: getValue(slipNode.date_add),
  dateUpd: getValue(slipNode.date_upd),
});

export const parseOrderSlip = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_slip;
  return mapOrderSlip(raw);
};

const parseOrderSlips = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_slips?.order_slip;
  return toArray(raw).map(mapOrderSlip);
};

export default parseOrderSlips;
