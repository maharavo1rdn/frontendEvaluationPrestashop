import { field, optionalField, wrapPrestashop } from "./xml.builder";

export const buildGuestXML = (guest) => {
  const inner = `
  <guest>
    ${guest.id ? field("id", guest.id) : "<!-- POST : pas d'id -->"}

    ${optionalField("id_customer", guest.idCustomer)}
  </guest>`;

  return wrapPrestashop(inner);
};
