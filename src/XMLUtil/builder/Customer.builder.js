import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildCustomerXML = (customer) => {
  const inner = `
  <customer>
    ${customer.id ? field("id", customer.id) : "<!-- POST : pas d'id -->"}

    ${field("firstname", customer.firstname ?? "")}
    ${field("lastname", customer.lastname ?? "")}
    ${field("email", customer.email ?? "")}
    ${field("passwd", customer.passwd ?? "")}

    ${optionalField("id_default_group", customer.idDefaultGroup)}
    ${optionalField("id_lang", customer.idLang)}
    ${optionalField("id_gender", customer.idGender)}
    ${optionalField("birthday", customer.birthday)}
    ${optionalField("newsletter", boolValue(customer.newsletter))}
    ${optionalField("optin", boolValue(customer.optin))}
    ${optionalField("website", customer.website)}
    ${optionalField("company", customer.company)}
    ${optionalField("siret", customer.siret)}
    ${optionalField("ape", customer.ape)}
    ${optionalField("outstanding_allow_amount", customer.outstandingAllowAmount)}
    ${optionalField("show_public_prices", boolValue(customer.showPublicPrices))}
    ${optionalField("id_risk", customer.idRisk)}
    ${optionalField("max_payment_days", customer.maxPaymentDays)}
    ${optionalField("active", boolValue(customer.active))}
    ${optionalField("note", customer.note)}
    ${optionalField("is_guest", boolValue(customer.isGuest))}
  </customer>`;

  return wrapPrestashop(inner);
};
