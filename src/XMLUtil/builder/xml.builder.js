// src/services/xml.builder.js

/**
 * Échappe les caractères spéciaux XML pour éviter de casser la structure.
 * À appliquer sur toute valeur utilisateur avant insertion dans le XML.
 *
 * @param {any} value
 * @returns {string}
 */
export const escapeXML = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
};

/**
 * Construit un champ simple avec CDATA — format attendu par PrestaShop.
 * Exemple : field("price", 19.99) → <price><![CDATA[19.99]]></price>
 *
 * @param {string} tag   - Nom de la balise XML
 * @param {any}    value - Valeur du champ
 * @returns {string}
 */
export const field = (tag, value) =>
  `<${tag}><![CDATA[${escapeXML(value)}]]></${tag}>`;

/**
 * Construit un champ multilingue PrestaShop.
 * PrestaShop exige cette structure pour name, description, link_rewrite, etc.
 * Exemple : langField("name", "T-Shirt", 1)
 * → <name><language id="1"><![CDATA[T-Shirt]]></language></name>
 *
 * @param {string} tag        - Nom de la balise XML
 * @param {any}    value      - Valeur du champ
 * @param {number} langId     - Id de la langue (défaut : 1)
 * @returns {string}
 */
export const langField = (tag, value, langId = 1) =>
  `<${tag}>
    <language id="${langId}"><![CDATA[${escapeXML(value)}]]></language>
  </${tag}>`;

/**
 * Enveloppe un bloc XML dans la structure racine PrestaShop.
 * Toute requête vers le WebService doit avoir cette enveloppe.
 *
 * @param {string} inner - Contenu XML de l'entité
 * @returns {string}
 */
export const wrapPrestashop = (inner) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
${inner}
</prestashop>`.trim();

/**
 * Génère un slug URL valide depuis un texte libre.
 * Utilisé pour link_rewrite — champ obligatoire dans PrestaShop.
 * Exemple : toSlug("T-Shirt Bleu !") → "t-shirt-bleu"
 *
 * @param {string} text
 * @returns {string}
 */
export const toSlug = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")                    // décompose les accents (é → e + ́)
    .replace(/[\u0300-\u036f]/g, "")     // supprime les diacritiques
    .replace(/\s+/g, "-")               // espaces → tirets
    .replace(/[^a-z0-9-]/g, "")         // supprime tout le reste
    .replace(/-+/g, "-")                // tirets multiples → un seul
    .replace(/^-|-$/g, "");             // supprime tirets en début/fin