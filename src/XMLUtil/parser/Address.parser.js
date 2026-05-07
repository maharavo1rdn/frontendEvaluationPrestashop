import { parseXML, getValue, getBoolean, toArray } from "./xml.parser";

export const mapAddress = (addressNode) => ({
  id: getValue(addressNode.id),
  idCustomer: getValue(addressNode.id_customer),
  idManufacturer: getValue(addressNode.id_manufacturer),
  idSupplier: getValue(addressNode.id_supplier),
  idWarehouse: getValue(addressNode.id_warehouse),
  idCountry: getValue(addressNode.id_country),
  idState: getValue(addressNode.id_state),
  alias: getValue(addressNode.alias),
  company: getValue(addressNode.company),
  lastname: getValue(addressNode.lastname),
  firstname: getValue(addressNode.firstname),
  address1: getValue(addressNode.address1),
  address2: getValue(addressNode.address2),
  postcode: getValue(addressNode.postcode),
  city: getValue(addressNode.city),
  other: getValue(addressNode.other),
  phone: getValue(addressNode.phone),
  phoneMobile: getValue(addressNode.phone_mobile),
  vatNumber: getValue(addressNode.vat_number),
  dni: getValue(addressNode.dni),
  deleted: getBoolean(addressNode.deleted),
  dateAdd: getValue(addressNode.date_add),
  dateUpd: getValue(addressNode.date_upd),
});

export const parseAddress = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.address;
  return mapAddress(raw);
};

const parseAddresses = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.addresses?.address;
  return toArray(raw).map(mapAddress);
};

export default parseAddresses;
