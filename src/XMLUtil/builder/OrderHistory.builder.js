import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildOrderHistoryXML = (history) => {
  const inner = `
  <order_history>
    ${history.id ? field("id", history.id) : "<!-- POST : pas d'id -->"}

    ${field("id_employee", history.idEmployee ?? 0)}
    ${field("id_order", history.idOrder ?? 0)}
    ${field("id_order_state", history.idOrderState ?? 0)}
    ${optionalField("date_add", history.dateAdd)}
  </order_history>`;

  return wrapPrestashop(inner);
};
