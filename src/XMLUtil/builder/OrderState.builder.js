import {
  field,
  langField,
  optionalField,
  wrapPrestashop,
} from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildOrderStateXML = (state) => {
  const langId = state.langId ?? 1;
  const inner = `
  <order_state>
    ${state.id ? field("id", state.id) : "<!-- POST : pas d'id -->"}

    ${langField("name", state.name ?? "", langId)}
    ${optionalField("color", state.color)}
    ${optionalField("send_email", boolValue(state.sendEmail))}
    ${optionalField("module_name", state.moduleName)}
    ${optionalField("invoice", boolValue(state.invoice))}
    ${optionalField("delivery", boolValue(state.delivery))}
    ${optionalField("logable", boolValue(state.logable))}
    ${optionalField("shipped", boolValue(state.shipped))}
    ${optionalField("paid", boolValue(state.paid))}
    ${optionalField("pdf_invoice", boolValue(state.pdfInvoice))}
    ${optionalField("pdf_delivery", boolValue(state.pdfDelivery))}
    ${optionalField("deleted", boolValue(state.deleted))}
    ${optionalField("hidden", boolValue(state.hidden))}
  </order_state>`;

  return wrapPrestashop(inner);
};
