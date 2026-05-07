import {
  parseXML,
  getValue,
  getNumber,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapCustomer = (customerNode) => ({
  id: getValue(customerNode.id),
  idDefaultGroup: getValue(customerNode.id_default_group),
  idLang: getValue(customerNode.id_lang),
  newsletterDateAdd: getValue(customerNode.newsletter_date_add),
  ipRegistrationNewsletter: getValue(customerNode.ip_registration_newsletter),
  lastPasswdGen: getValue(customerNode.last_passwd_gen),
  secureKey: getValue(customerNode.secure_key),
  deleted: getBoolean(customerNode.deleted),
  passwd: getValue(customerNode.passwd),
  lastname: getValue(customerNode.lastname),
  firstname: getValue(customerNode.firstname),
  email: getValue(customerNode.email),
  idGender: getValue(customerNode.id_gender),
  birthday: getValue(customerNode.birthday),
  newsletter: getBoolean(customerNode.newsletter),
  optin: getBoolean(customerNode.optin),
  website: getValue(customerNode.website),
  company: getValue(customerNode.company),
  siret: getValue(customerNode.siret),
  ape: getValue(customerNode.ape),
  outstandingAllowAmount: getNumber(customerNode.outstanding_allow_amount),
  showPublicPrices: getBoolean(customerNode.show_public_prices),
  idRisk: getValue(customerNode.id_risk),
  maxPaymentDays: getInteger(customerNode.max_payment_days),
  active: getBoolean(customerNode.active),
  note: getValue(customerNode.note),
  isGuest: getBoolean(customerNode.is_guest),
  dateAdd: getValue(customerNode.date_add),
  dateUpd: getValue(customerNode.date_upd),
});

export const parseCustomer = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.customer;
  return mapCustomer(raw);
};

const parseCustomers = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.customers?.customer;
  return toArray(raw).map(mapCustomer);
};

export default parseCustomers;
