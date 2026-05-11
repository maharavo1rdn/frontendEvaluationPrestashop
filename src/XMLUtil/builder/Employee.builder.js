import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildEmployeeXML = (employee) => {
  const inner = `
  <employee>
    ${employee.id ? field("id", employee.id) : "<!-- POST : pas d'id -->"}

    ${field("id_lang", employee.idLang ?? "")}
    ${field("passwd", employee.passwd ?? "")}
    ${field("lastname", employee.lastname ?? "")}
    ${field("firstname", employee.firstname ?? "")}
    ${field("email", employee.email ?? "")}
    ${field("id_profile", employee.idProfile ?? "")}

    ${optionalField("last_passwd_gen", employee.lastPasswdGen)}
    ${optionalField("stats_date_from", employee.statsDateFrom)}
    ${optionalField("stats_date_to", employee.statsDateTo)}
    ${optionalField("stats_compare_from", employee.statsCompareFrom)}
    ${optionalField("stats_compare_to", employee.statsCompareTo)}
    ${optionalField("active", boolValue(employee.active))}
    ${optionalField("bo_color", employee.boColor)}
    ${optionalField("default_tab", employee.defaultTab)}
    ${optionalField("bo_theme", employee.boTheme)}
    ${optionalField("bo_css", employee.boCss)}
    ${optionalField("bo_width", employee.boWidth)}
    ${optionalField("bo_menu", boolValue(employee.boMenu))}
    ${optionalField("stats_compare_option", employee.statsCompareOption)}
    ${optionalField("preselect_date_range", employee.preselectDateRange)}
    ${optionalField("id_last_order", employee.idLastOrder)}
    ${optionalField("id_last_customer_message", employee.idLastCustomerMessage)}
    ${optionalField("id_last_customer", employee.idLastCustomer)}
    ${optionalField("reset_password_token", employee.resetPasswordToken)}
    ${optionalField("reset_password_validity", employee.resetPasswordValidity)}
    ${optionalField("has_enabled_gravatar", boolValue(employee.hasEnabledGravatar))}
  </employee>`;

  return wrapPrestashop(inner);
};
