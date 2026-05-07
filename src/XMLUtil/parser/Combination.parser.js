import {
  parseXML,
  getValue,
  getNumber,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

const toIdArray = (nodes) => toArray(nodes).map((node) => getValue(node.id));

export const mapCombination = (combinationNode) => ({
  id: getValue(combinationNode.id),
  idProduct: getValue(combinationNode.id_product),
  reference: getValue(combinationNode.reference),
  supplierReference: getValue(combinationNode.supplier_reference),
  location: getValue(combinationNode.location),
  ean13: getValue(combinationNode.ean13),
  isbn: getValue(combinationNode.isbn),
  upc: getValue(combinationNode.upc),
  mpn: getValue(combinationNode.mpn),
  wholesalePrice: getNumber(combinationNode.wholesale_price),
  price: getNumber(combinationNode.price),
  ecotax: getNumber(combinationNode.ecotax),
  quantity: getInteger(combinationNode.quantity),
  weight: getNumber(combinationNode.weight),
  unitPriceImpact: getNumber(combinationNode.unit_price_impact),
  minimalQuantity: getInteger(combinationNode.minimal_quantity),
  defaultOn: getBoolean(combinationNode.default_on),
  availableDate: getValue(combinationNode.available_date),
  associations: {
    productOptionValues: toIdArray(
      combinationNode?.associations?.product_option_values?.product_option_value
    ),
    images: toIdArray(combinationNode?.associations?.images?.image),
    stockAvailables: toArray(
      combinationNode?.associations?.stock_availables?.stock_available
    ).map((stock) => ({
      id: getValue(stock.id),
      idProductAttribute: getValue(stock.id_product_attribute),
    })),
  },
});

export const parseCombination = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.combination;
  return mapCombination(raw);
};

const parseCombinations = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.combinations?.combination;
  return toArray(raw).map(mapCombination);
};

export default parseCombinations;
