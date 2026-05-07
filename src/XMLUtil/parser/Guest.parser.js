import { parseXML, getValue, toArray } from "./xml.parser";

export const mapGuest = (guestNode) => ({
  id: getValue(guestNode.id),
  customer: getValue(guestNode.id_customer),
});

export const parseGuest = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.guest;
  return mapGuest(raw);
};

const parseGuests = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.guests?.guest;
  return toArray(raw).map(mapGuest);
};

export default parseGuests;
