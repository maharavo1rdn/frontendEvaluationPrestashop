import { parseXML, getValue, getNumber, toArray } from "./xml.parser";

export const mapOrderPayment = (paymentNode) => ({
  id: getValue(paymentNode.id),
  orderReference: getValue(paymentNode.order_reference),
  idCurrency: getValue(paymentNode.id_currency),
  amount: getNumber(paymentNode.amount),
  paymentMethod: getValue(paymentNode.payment_method),
  conversionRate: getNumber(paymentNode.conversion_rate),
  transactionId: getValue(paymentNode.transaction_id),
  cardNumber: getValue(paymentNode.card_number),
  cardBrand: getValue(paymentNode.card_brand),
  cardExpiration: getValue(paymentNode.card_expiration),
  cardHolder: getValue(paymentNode.card_holder),
  dateAdd: getValue(paymentNode.date_add),
});

export const parseOrderPayment = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_payment;
  return mapOrderPayment(raw);
};

const parseOrderPayments = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_payments?.order_payment;
  return toArray(raw).map(mapOrderPayment);
};

export default parseOrderPayments;
