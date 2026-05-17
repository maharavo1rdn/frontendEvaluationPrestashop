import { findCategoryByKeyValue, postCategory } from "../category.service";
import { findManufacturerByKeyValue } from "../manufacturer.service";
import { postProduct } from "../product.service";
import { findTaxByKeyValue, postTax } from "../tax.service";
import {
  findTaxRulesGroupByKeyValue,
  postTaxRulesGroup,
} from "../taxRulesGroup.service";
import { findTaxRulesByGroupId, postTaxRule } from "../taxRule.service";
import { parseCSVFile } from "./csv.service";
import { parseDate, parseNumber, parsePercentage } from "../../utils/utils";
import { findProductByKeyValue } from "../product.service";

const parseOptionalNumber = (value) =>
  value === undefined || value === null || String(value).trim() === ""
    ? undefined
    : parseNumber(value);

const roundPrice = (value) => Number(Number(value).toFixed(6));

const ensureCategoryId = async (categoryName) => {
  if (!categoryName) return 2;
  const categories = await findCategoryByKeyValue("name", categoryName);
  if (categories.length > 0) return Number(categories[0].id);

  const created = await postCategory({
    name: categoryName,
    idParent: 2,
    active: true,
    langId: 1,
  });

  if (!created.success) {
    throw new Error(`Impossible de creer la categorie "${categoryName}"`);
  }

  if (!created.id) {
    const retry = await findCategoryByKeyValue("name", categoryName);
    if (retry.length > 0) return Number(retry[0].id);
  }

  return Number(created.id);
};

const ensureTaxRulesGroupId = async (taxRate) => {
  if (!taxRate && taxRate !== 0) return 1;

  const rateLabel = Number(taxRate).toFixed(2).replace(/\.00$/, "");
  const taxName = `TVA ${rateLabel}%`;

  let taxes = await findTaxByKeyValue("rate", taxRate);
  let taxId = taxes[0]?.id;
  if (!taxId) {
    const createdTax = await postTax({
      name: taxName,
      rate: taxRate,
      active: true,
    });
    if (!createdTax.success) {
      throw new Error(`Impossible de creer la taxe "${taxName}"`);
    }
    taxId = createdTax.id;
  }

  if (!taxId) {
    throw new Error(`Taxe introuvable pour ${taxName}`);
  }

  let groups = await findTaxRulesGroupByKeyValue("name", taxName);
  let groupId = groups[0]?.id;
  if (!groupId) {
    const createdGroup = await postTaxRulesGroup({
      name: taxName,
      active: true,
    });
    if (!createdGroup.success) {
      throw new Error(`Impossible de creer le groupe de taxe "${taxName}"`);
    }
    groupId = createdGroup.id;
  }

  if (!groupId) {
    throw new Error(`Groupe de taxe introuvable pour ${taxName}`);
  }

  const rules = await findTaxRulesByGroupId(groupId);
  const hasRule = rules.some((rule) => String(rule.taxId) === String(taxId));

  if (!hasRule) {
    const createdRule = await postTaxRule({
      taxRulesGroupId: groupId,
      taxId,
      countryId: 8,
      stateId: 1,
      zipcodeFrom: 0,
      zipcodeTo: 0,
      behavior: 0,
      description: taxName,
    });
    if (!createdRule.success) {
      throw new Error(`Impossible de creer la regle de taxe "${taxName}"`);
    }
  }

  return Number(groupId);
};
/**
 * Mappe une ligne CSV en objet catégorie attendu par buildCategoryXML.
 * @param {Object} row - Ligne parsée par PapaParse
 * @returns {Object}
 */
export const mapRowToProduct = async (row) => {
  const name = row.nom?.trim();
  if (!name) {
    throw new Error("Nom de produit manquant");
  }
  const existing = await findProductByKeyValue("reference", row.reference);
  if (existing && existing.length > 0)
    throw new Error("Produit avec le même référence existant");

  const categoryName = row.categorie?.trim();
  const categoryId = await ensureCategoryId(categoryName);

  const manufacturerName = row.manufacturer_name?.trim();
  const manufacturers = manufacturerName
    ? await findManufacturerByKeyValue("name", manufacturerName)
    : [];
  const manufacturerId =
    manufacturers.length > 0 ? Number(manufacturers[0].id) : undefined;

  const rawTax = row.Taxe ?? row.taxe;
  const taxRate = rawTax === undefined ? undefined : parsePercentage(rawTax);
  const taxRulesGroupId = await ensureTaxRulesGroupId(taxRate);

  const priceTtcRaw = row.prix_ttc;
  const priceHtRaw = row.prix_ht;
  const purchasePriceRaw = row.prix_achat;
  const priceTtc = parseOptionalNumber(priceTtcRaw);
  const priceHtFallback = parseOptionalNumber(priceHtRaw);
  const purchasePrice = parseOptionalNumber(purchasePriceRaw);
  const priceHt =
    priceTtcRaw !== undefined && priceTtc !== undefined
      ? taxRate !== undefined
        ? roundPrice(priceTtc / (1 + taxRate / 100))
        : priceTtc
      : priceHtFallback;

  const availableDate = parseDate(row.date_availability_produit);

  return {
    name,
    reference: row.reference?.trim() || "",
    price: Number.isFinite(priceHt) ? priceHt : undefined,
    wholesalePrice: purchasePrice,
    active: row.active !== "0",
    description: row.description || undefined,
    category_name: categoryName ? String(categoryName) : "",
    categoryId,
    manufacturerId,
    state: 1,
    manufacturer_name: manufacturerName ? String(manufacturerName) : "",
    weight: parseOptionalNumber(row.weight),
    quantity: parseOptionalNumber(row.quantity),
    langId: parseNumber(row.langId ?? row.lang_id) || 1,
    taxRulesGroupId,
    availableDate,
    associations: {
      categories: categoryId ? [{ id: categoryId }] : [],
    },
  };
};

/**
 * Importe des catégories depuis un fichier CSV via l'API PrestaShop.
 * Traite chaque ligne séquentiellement pour éviter de surcharger l'API.
 *
 * @param {File} file          - Fichier CSV sélectionné via <input type="file">
 * @param {Function} onProgress - Callback appelé après chaque ligne traitée
 *   → onProgress({ done: number, total: number, result: Object })
 *
 * @returns {Promise<{ success: Object[], errors: Object[] }>}
 */
export const importProductsFromCSV = async (file, onProgress) => {
  const rows = await parseCSVFile(file);
  const total = rows.length;
  const successes = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let result = null;
    try {
      const product = await mapRowToProduct(row);
      result = await postProduct(product);
      result.success ? successes.push(result) : errors.push(result);
    } catch (error) {
      const fallbackName = row.nom?.trim() || `Ligne ${i + 1}`;
      result = { success: false, name: fallbackName, error: error.message };
      errors.push(result);
    }

    onProgress?.({ done: i + 1, total, result });
  }

  return { success: successes, errors };
};
