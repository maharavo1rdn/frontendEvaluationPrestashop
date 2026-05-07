import { XMLParser } from "fast-xml-parser";

// ── Configuration partagée du parser ─────────────────────────
const parserOptions = {
  ignoreAttributes: false, // conserver les attributs XML (ex: xlink:href)
  attributeNamePrefix: "@_", // préfixe des attributs → @_href, @_id
  dataPropName: "__cdata", // CDATA → { __cdata: "valeur" }
  allowBooleanAttributes: true,
  parseAttributeValue: true,
};

/**
 * Extrait la valeur d'un champ, qu'il soit CDATA ou texte brut.
 * PrestaShop entoure ses valeurs de CDATA : <id><![CDATA[1]]></id>
 * fast-xml-parser les transforme en : { __cdata: "1" }
 *
 * @param {any} node - La valeur brute retournée par fast-xml-parser
 * @returns {string|null}
 */
export const getValue = (node) => {
  if (node === undefined || node === null) return "";

  if (typeof node === "object") {
    return node["#text"] || node["__cdata"] || node["_"] || "";
  }
  return String(node);
};

export const getTranslatableValue = (node) => {
  if (!node) return "";

  if (node.language) {
    const lang = Array.isArray(node.language)
      ? node.language[0]
      : node.language;

    return getValue(lang);
  }

  return getValue(node);
};

export const getNumber = (node, fallback = 0) => {
  const value = parseFloat(getValue(node));
  return Number.isNaN(value) ? fallback : value;
};

export const getInteger = (node, fallback = 0) => {
  const value = parseInt(getValue(node), 10);
  return Number.isNaN(value) ? fallback : value;
};

export const getBoolean = (node) => {
  const value = getValue(node);
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};
/**
 * Parse une chaîne XML PrestaShop en objet JavaScript.
 * @param {string} xmlString - Réponse brute de l'API
 * @returns {Object} - Objet JS navigable
 */
export const parseXML = (xmlString) => {
  const parser = new XMLParser(parserOptions);
  return parser.parse(xmlString); // ← Objet JS direct, plus de DOM
};

/**
 * Normalise un résultat qui peut être un objet seul ou un tableau.
 * PrestaShop retourne un objet si 1 seul résultat, un tableau si plusieurs.
 * @param {Object|Array|undefined} data
 * @returns {Array}
 */
export const toArray = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};
