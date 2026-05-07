import { parseXML, getValue, toArray } from "./xml.parser";

export const mapOrderHistory = (historyNode) => ({
  id: getValue(historyNode.id),
  idEmployee: getValue(historyNode.id_employee),
  idOrder: getValue(historyNode.id_order),
  idOrderState: getValue(historyNode.id_order_state),
  dateAdd: getValue(historyNode.date_add),
});

export const parseOrderHistory = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_history;
  return mapOrderHistory(raw);
};

const parseOrderHistories = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.order_histories?.order_history;
  return toArray(raw).map(mapOrderHistory);
};

export default parseOrderHistories;
