import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildOrderPaymentXML = (payment) => {
  const inner = `
  <order_payment>
    ${payment.id ? field("id", payment.id) : "<!-- POST : pas d'id -->"}

    ${field("order_reference", payment.orderReference ?? "")}
    ${field("id_currency", payment.idCurrency ?? 0)}
    ${field("amount", payment.amount ?? 0)}
    ${field("payment_method", payment.paymentMethod ?? "")}

    ${optionalField("conversion_rate", payment.conversionRate)}
    ${optionalField("transaction_id", payment.transactionId)}
    ${optionalField("card_number", payment.cardNumber)}
    ${optionalField("card_brand", payment.cardBrand)}
    ${optionalField("card_expiration", payment.cardExpiration)}
    ${optionalField("card_holder", payment.cardHolder)}
  </order_payment>`;

  return wrapPrestashop(inner);
};
