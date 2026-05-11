import {
  parseXML,
  getValue,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

export const mapEmployee = (employeeNode) => ({
  id: getValue(employeeNode.id),
  idLang: getValue(employeeNode.id_lang),
  lastPasswdGen: getValue(employeeNode.last_passwd_gen),
  statsDateFrom: getValue(employeeNode.stats_date_from),
  statsDateTo: getValue(employeeNode.stats_date_to),
  statsCompareFrom: getValue(employeeNode.stats_compare_from),
  statsCompareTo: getValue(employeeNode.stats_compare_to),
  passwd: getValue(employeeNode.passwd),
  lastname: getValue(employeeNode.lastname),
  firstname: getValue(employeeNode.firstname),
  email: getValue(employeeNode.email),
  active: getBoolean(employeeNode.active),
  idProfile: getInteger(employeeNode.id_profile),
  boColor: getValue(employeeNode.bo_color),
  defaultTab: getInteger(employeeNode.default_tab),
  boTheme: getValue(employeeNode.bo_theme),
  boCss: getValue(employeeNode.bo_css),
  boWidth: getInteger(employeeNode.bo_width),
  boMenu: getBoolean(employeeNode.bo_menu),
  statsCompareOption: getInteger(employeeNode.stats_compare_option),
  preselectDateRange: getValue(employeeNode.preselect_date_range),
  idLastOrder: getInteger(employeeNode.id_last_order),
  idLastCustomerMessage: getInteger(employeeNode.id_last_customer_message),
  idLastCustomer: getInteger(employeeNode.id_last_customer),
  resetPasswordToken: getValue(employeeNode.reset_password_token),
  resetPasswordValidity: getValue(employeeNode.reset_password_validity),
  hasEnabledGravatar: getBoolean(employeeNode.has_enabled_gravatar),
});

export const parseEmployee = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.employee;
  return mapEmployee(raw);
};

const parseEmployees = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.employees?.employee;
  return toArray(raw).map(mapEmployee);
};

export default parseEmployees;
