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

const normalizeRow = (row) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key.trim().toLowerCase()] = value;
  });
  return normalized;
};

const getRowValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key.toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

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
      countryId: 0,
      stateId: 0,
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
  const normalized = normalizeRow(row);
  const name = getRowValue(normalized, ["name", "nom"]);
  if (!name) {
    throw new Error("Nom de produit manquant");
  }

  const categoryName = getRowValue(normalized, [
    "category_name",
    "categorie",
    "category",
  ]);
  const categoryId = await ensureCategoryId(categoryName);

  const manufacturerName = getRowValue(normalized, [
    "manufacturer_name",
    "manufacturer",
  ]);
  const manufacturers = manufacturerName
    ? await findManufacturerByKeyValue("name", manufacturerName)
    : [];
  const manufacturerId =
    manufacturers.length > 0 ? Number(manufacturers[0].id) : undefined;

  const rawTax = getRowValue(normalized, ["taxe", "tax", "tax_rate", "taxrate"]);
  const taxRate =
    rawTax === undefined ? undefined : parsePercentage(rawTax);
  const taxRulesGroupId = await ensureTaxRulesGroupId(taxRate);

  const priceTtcRaw = getRowValue(normalized, [
    "prix_ttc",
    "price_ttc",
    "price",
    "prix",
  ]);
  const priceHtRaw = getRowValue(normalized, ["prix_ht", "price_ht"]);
  const priceTtc = parseOptionalNumber(priceTtcRaw);
  const priceHtFallback = parseOptionalNumber(priceHtRaw);
  const priceHt =
    priceTtcRaw !== undefined && priceTtc !== undefined
      ? taxRate !== undefined
        ? roundPrice(priceTtc / (1 + taxRate / 100))
        : priceTtc
      : priceHtFallback;

  const availableDate = parseDate(
    getRowValue(normalized, ["date_produit", "date", "available_date"])
  );

  return {
    name,
    reference: getRowValue(normalized, ["reference", "ref", "sku"]) || "",
    price: Number.isFinite(priceHt) ? priceHt : undefined,
    active: getRowValue(normalized, ["active"]) !== "0",
    description: getRowValue(normalized, ["description"]) || undefined,
    category_name: categoryName ? String(categoryName) : "",
    categoryId,
    manufacturerId,
    manufacturer_name: manufacturerName ? String(manufacturerName) : "",
    weight: parseOptionalNumber(getRowValue(normalized, ["weight", "poids"])),
    quantity: parseOptionalNumber(
      getRowValue(normalized, ["quantity", "quantite"])
    ),
    langId: parseNumber(getRowValue(normalized, ["langid", "lang_id"])) || 1,
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
      const normalized = normalizeRow(row);
      const fallbackName =
        getRowValue(normalized, ["name", "nom"]) || `Ligne ${i + 1}`;
      result = { success: false, name: fallbackName, error: error.message };
      errors.push(result);
    }

    onProgress?.({ done: i + 1, total, result });
  }

  return { success: successes, errors };
};
