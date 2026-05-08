import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildAddressXML = (address) => {
  const inner = `
  <address>
    ${address.id ? field("id", address.id) : "<!-- POST : pas d'id -->"}

    ${field("id_customer", address.idCustomer ?? 0)}
    ${field("id_country", address.idCountry ?? 0)}
    ${field("alias", address.alias ?? "")}
    ${field("lastname", address.lastname ?? "")}
    ${field("firstname", address.firstname ?? "")}
    ${field("address1", address.address1 ?? "")}
    ${field("city", address.city ?? "")}

    ${optionalField("id_manufacturer", address.idManufacturer)}
    ${optionalField("id_supplier", address.idSupplier)}
    ${optionalField("id_warehouse", address.idWarehouse)}
    ${optionalField("id_state", address.idState)}
    ${optionalField("company", address.company)}
    ${optionalField("address2", address.address2)}
    ${optionalField("postcode", address.postcode)}
    ${optionalField("other", address.other)}
    ${optionalField("phone", address.phone)}
    ${optionalField("phone_mobile", address.phoneMobile)}
    ${optionalField("vat_number", address.vatNumber)}
    ${optionalField("dni", address.dni)}
    ${optionalField("deleted", boolValue(address.deleted))}
  </address>`;

  return wrapPrestashop(inner);
};
