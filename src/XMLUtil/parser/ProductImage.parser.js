import {
  parseXML,
  getValue,
  getInteger,
  getBoolean,
  toArray,
} from "./xml.parser";

/**
 * Mappe un nœud XML image PrestaShop en objet JS.
 */
export const mapProductImage = (imageNode) => ({
  id: getValue(imageNode.id),
  idProduct: getValue(imageNode.id_product),
  position: getInteger(imageNode.position),
  cover: getBoolean(imageNode.cover),
});

/**
 * Parse la réponse XML d'un upload ou d'un GET image unique.
 */
export const parseProductImage = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.image;
  if (!raw) return null;
  return mapProductImage(raw);
};

/**
 * Parse la liste des images d'un produit.
 */
const parseProductImages = (xmlString) => {
  const result = parseXML(xmlString);
  const raw = result?.prestashop?.images?.image;
  return toArray(raw).map(mapProductImage);
};

export default parseProductImages;
