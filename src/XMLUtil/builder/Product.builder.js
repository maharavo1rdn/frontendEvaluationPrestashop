
import {
  field,
  langField,
  optionalField,
  wrapPrestashop,
  toSlug,
} from "./xml.builder";

// ─── Associations ─────────────────────────────────────────────────────────────

/**
 * Construit le bloc <categories> des associations.
 * @param {Array<{ id: string }>} categories
 */
const buildCategories = (categories = []) => {
  if (!categories.length) return "";
  return `
    <categories>
      ${categories
        .map((c) => `<category>${field("id", c.id)}</category>`)
        .join("\n      ")}
    </categories>`;
};

/**
 * Construit le bloc <images> des associations.
 * @param {Array<{ id: string }>} images
 */
const buildImages = (images = []) => {
  if (!images.length) return "";
  return `
    <images>
      ${images
        .map((img) => `<image>${field("id", img.id)}</image>`)
        .join("\n      ")}
    </images>`;
};

/**
 * Construit le bloc <stock_availables> des associations.
 * id_product_attribute = "0" pour un produit sans déclinaison.
 * @param {Array<{ id: string, idProductAttribute: string }>} stocks
 */
const buildStocks = (stocks = []) => {
  if (!stocks.length) return "";
  return `
    <stock_availables>
      ${stocks
        .map(
          (s) => `<stock_available>
        ${field("id", s.id)}
        ${field("id_product_attribute", s.idProductAttribute ?? 0)}
      </stock_available>`
        )
        .join("\n      ")}
    </stock_availables>`;
};

/**
 * Construit le bloc <product_features> des associations.
 * @param {Array<{ id: string, idFeatureValue: string }>} features
 */
const buildFeatures = (features = []) => {
  if (!features.length) return "";
  return `
    <product_features>
      ${features
        .map(
          (f) => `<product_feature>
        ${field("id", f.id)}
        ${field("id_feature_value", f.idFeatureValue)}
      </product_feature>`
        )
        .join("\n      ")}
    </product_features>`;
};

/**
 * Construit le bloc <tags> des associations.
 * @param {Array<{ id: string }>} tags
 */
const buildTags = (tags = []) => {
  if (!tags.length) return "";
  return `
    <tags>
      ${tags
        .map((t) => `<tag>${field("id", t.id)}</tag>`)
        .join("\n      ")}
    </tags>`;
};

/**
 * Assemble tous les blocs d'associations dans <associations>.
 * Les blocs vides sont omis automatiquement.
 *
 * @param {Object} associations
 * @param {Array}  associations.categories
 * @param {Array}  associations.images
 * @param {Array}  associations.stockAvailables
 * @param {Array}  associations.features
 * @param {Array}  associations.tags
 */
const buildAssociations = (associations = {}) => {
  const {
    categories      = [],
    images          = [],
    stockAvailables = [],
    features        = [],
    tags            = [],
  } = associations;

  const blocks = [
    buildCategories(categories),
    buildImages(images),
    buildStocks(stockAvailables),
    buildFeatures(features),
    buildTags(tags),
  ]
    .filter(Boolean) // supprime les blocs vides
    .join("");

  if (!blocks) return ""; // pas d'associations du tout → on omet la balise

  return `
  <associations>
    ${blocks}
  </associations>`;
};

// ─── Builder principal ────────────────────────────────────────────────────────

/**
 * Construit le XML complet d'un produit pour POST (création) ou PUT (mise à jour).
 *
 * Champs requis par PrestaShop :
 *   - name             (multilingue)
 *   - link_rewrite     (multilingue, généré automatiquement depuis name)
 *   - price
 *   - id_tax_rules_group
 *   - id_category_default
 *
 * @param {Object}  product
 * @param {string}  [product.id]               - Obligatoire pour PUT, absent pour POST
 * @param {string}  product.name               - Nom du produit
 * @param {string}  [product.description]      - Description courte
 * @param {string}  [product.reference]        - Référence SKU
 * @param {number}  [product.price]            - Prix HT
 * @param {boolean} [product.active]           - Visible en boutique
 * @param {string}  [product.type]             - "simple" | "combinations" | "virtual"
 * @param {number}  [product.taxRulesGroupId]  - Id groupe TVA (défaut : 1)
 * @param {number}  [product.categoryId]       - Id catégorie par défaut (défaut : 2)
 * @param {number}  [product.langId]           - Id langue (défaut : 1)
 * @param {string}  [product.availableDate]    - Date de disponibilite (YYYY-MM-DD)
 * @param {Object}  [product.associations]     - Associations (catégories, stocks, etc.)
 *
 * @returns {string} - XML string prêt à envoyer
 */
export const buildProductXML = (product) => {
  const langId = product.langId ?? 1;

  const inner = `
  <product>
    ${product.id ? field("id", product.id) : "<!-- POST : pas d'id -->"}

    ${field("reference",           product.reference        ?? "")}
    ${field("price",               product.price            ?? 0)}
    ${field("active",              product.active ? 1 : 0)}
    ${field("type",                product.type             ?? "simple")}
    ${field("id_tax_rules_group",  product.taxRulesGroupId  ?? 1)}
    ${field("id_category_default", product.categoryId       )}
    ${field("id_manufacturer",     product.manufacturerId       )}
    ${optionalField("available_date", product.availableDate)}

    ${langField("name",              product.name        ?? "",  langId)}
    ${langField("description_short", product.description ?? "",  langId)}
    ${langField("link_rewrite",      toSlug(product.name),       langId)}

    ${buildAssociations(product.associations)}
  </product>`;

  return wrapPrestashop(inner);
};