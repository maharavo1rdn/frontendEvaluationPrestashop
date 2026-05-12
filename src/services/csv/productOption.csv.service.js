import { parseCSVFile } from "./csv.service";
import { findProductByKeyValue } from "../product.service";
import {
  findProductOptionByKeyValue,
  postProductOption,
} from "../productOption.service";
import {
  findProductOptionValueByKeyValue,
  postProductOptionValue,
} from "../productOptionValue.service";
import {
  findCombinationsByProductId,
  postCombination,
} from "../combination.service";
import {
  findStockAvailableByProductAttribute,
  postStockAvailable,
  updateStockAvailable,
} from "../stockAvailable.service";
import { findTaxRulesByGroupId } from "../taxRule.service";
import { findTaxByKeyValue } from "../tax.service";
import { parseNumber } from "../../utils/utils";

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  return parseNumber(raw);
};

const parseOptionalBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return undefined;
  if (["1", "true", "yes", "y", "oui"].includes(raw)) return true;
  if (["0", "false", "no", "n", "non"].includes(raw)) return false;
  return undefined;
};

const taxRateCache = new Map();

const getTaxRateByGroupId = async (groupId) => {
  if (!groupId) return 0;
  const cacheKey = String(groupId);
  if (taxRateCache.has(cacheKey)) return taxRateCache.get(cacheKey);

  const rules = await findTaxRulesByGroupId(groupId);
  const taxId = rules[0]?.taxId;
  if (!taxId) {
    taxRateCache.set(cacheKey, 0);
    return 0;
  }

  const taxes = await findTaxByKeyValue("id", taxId);
  const rate = Number(taxes[0]?.rate) || 0;
  taxRateCache.set(cacheKey, rate);
  return rate;
};

const computePriceImpact = (priceTtc, taxRate, basePriceHt) => {
  if (priceTtc === undefined || priceTtc === null) return undefined;
  const base = Number(basePriceHt);
  if (!Number.isFinite(base)) return undefined;
  const rate = Number(taxRate) || 0;
  const priceHt = priceTtc / (1 + rate / 100);
  const impact = priceHt - base;
  return Number.isFinite(impact) ? impact : undefined;
};

/**
 * Trouve ou crée une option de produit.
 * @param {string} optionName - Nom de l'option (ex: "taille", "couleur")
 * @returns {Promise<{ id: string, name: string }>}
 */
const ensureProductOption = async (optionName) => {
  if (!optionName) {
    throw new Error("Nom d'option manquant");
  }

  const existing = await findProductOptionByKeyValue("name", optionName);
  if (existing.length > 0) {
    return { id: existing[0].id, name: existing[0].name };
  }

  const created = await postProductOption({
    name: optionName,
    publicName: optionName,
    groupType: optionName,
    isColorGroup: optionName.toLowerCase() === "couleur",
    langId: 1,
  });

  if (!created.success) {
    throw new Error(
      `Impossible de créer l'option "${optionName}": ${created.error}`
    );
  }

  return { id: created.id, name: optionName };
};

/**
 * Trouve ou crée une valeur d'option de produit.
 * @param {string} valueName - Nom de la valeur (ex: "ngoza", "kely")
 * @returns {Promise<{ id: string, name: string }>}
 */
const ensureProductOptionValue = async (valueName) => {
  if (!valueName) {
    throw new Error("Nom de valeur d'option manquant");
  }

  const existing = await findProductOptionValueByKeyValue("name", valueName);
  if (existing.length > 0) {
    return { id: existing[0].id, name: existing[0].name };
  }

  const created = await postProductOptionValue({
    name: valueName,
    langId: 1,
  });

  if (!created.success) {
    throw new Error(
      `Impossible de créer la valeur d'option "${valueName}": ${created.error}`
    );
  }

  return { id: created.id, name: valueName };
};

/**
 * Mappe une ligne CSV en objet pour créer/mettre à jour un produit avec options.
 * @param {Object} row - Ligne parsée
 * @param {Object} product - Produit trouvé
 * @returns {Object} Données structurées
 */
const mapRowToProductOptionData = async (row, product, taxRate) => {
  const specificity = row.specificité?.trim();
  const value = row.karazany?.trim();
  const initialStock = parseOptionalNumber(row.stock_initial);
  const priceTtc = parseOptionalNumber(row.prix_vente_ttc);
  const combinationReference =
    row.reference_combination?.trim() || row.reference?.trim();
  const defaultOn = parseOptionalBoolean(
    row.default_on ?? row.default ?? row.defaut
  );
  const priceImpact = computePriceImpact(priceTtc, taxRate, product.price);

  const result = {
    productId: product.id,
    productReference: row.reference?.trim(),
    optionName: specificity,
    valueName: value,
    stock: initialStock,
    priceTtc: priceTtc,
    priceImpact,
    combinationReference,
    defaultOn,
    hasOption: !!(specificity && value),
  };

  if (result.hasOption) {
    const option = await ensureProductOption(specificity);
    const optionValue = await ensureProductOptionValue(value);
    result.option = option;
    result.optionValue = optionValue;
    result.attributeIds = [optionValue.idAttribute || optionValue.id];
  }

  return result;
};

const normalizeIds = (ids) => ids.map((id) => String(id)).sort();

const findMatchingCombination = (combinations, attributeIds) => {
  const target = normalizeIds(attributeIds);
  return combinations.find((combination) => {
    const existing = normalizeIds(
      combination?.associations?.productOptionValues ?? []
    );
    if (existing.length !== target.length) return false;
    return target.every((id, index) => id === existing[index]);
  });
};

const findOrCreateCombination = async ({
  productId,
  attributeIds,
  quantity,
  priceImpact,
  reference,
  defaultOn,
}) => {
  const combinations = await findCombinationsByProductId(productId);
  const existing = findMatchingCombination(combinations, attributeIds);
  if (existing) {
    return { id: existing.id, reused: true };
  }

  const created = await postCombination({
    idProduct: productId,
    quantity,
    price: priceImpact,
    reference,
    defaultOn,
    associations: {
      productOptionValues: attributeIds,
    },
  });

  if (!created.success) {
    throw new Error(created.error || "Creation de combinaison impossible");
  }

  return { id: created.id, reused: false };
};

/**
 * Importe les options de produits depuis un fichier CSV.
 * Traite chaque ligne séquentiellement pour respecter les dépendances.
 *
 * @param {File} file          - Fichier CSV sélectionné
 * @param {Function} onProgress - Callback appelé après chaque ligne
 *   → onProgress({ done: number, total: number, result: Object })
 *
 * @returns {Promise<{ success: Object[], errors: Object[] }>}
 */
export const importProductOptionsFromCSV = async (file, onProgress) => {
  const rows = await parseCSVFile(file);
  const total = rows.length;
  const successes = [];
  const errors = [];

  let processedCount = 0;

  for (const row of rows) {
    const reference = row.reference?.trim();
    let processResult = null;

    try {
      if (!reference) {
        throw new Error("Référence produit manquante");
      }

      const products = await findProductByKeyValue("reference", reference);
      if (!products.length) {
        throw new Error(`Produit avec référence "${reference}" non trouvé`);
      }
      const product = products[0];
      const taxRate = await getTaxRateByGroupId(product.idTaxRulesGroup);

      const mappedData = await mapRowToProductOptionData(row, product, taxRate);

      let combination = null;
      let stockAvailable = null;
      if (mappedData.hasOption && mappedData.attributeIds?.length) {
        combination = await findOrCreateCombination({
          productId: product.id,
          attributeIds: mappedData.attributeIds,
          quantity: mappedData.stock,
          priceImpact: mappedData.priceImpact,
          reference: mappedData.combinationReference,
          defaultOn: mappedData.defaultOn,
        });
      }

      if (mappedData.stock !== undefined && mappedData.stock !== null) {
        const idProductAttribute = combination?.id ?? 0;
        const existingStocks = await findStockAvailableByProductAttribute(
          product.id,
          idProductAttribute
        );
        if (existingStocks.length > 0) {
          const updatedStock = await updateStockAvailable({
            id: existingStocks[0].id,
            idProduct: product.id,
            idProductAttribute,
            quantity: mappedData.stock,
          });
          if (!updatedStock.success) {
            throw new Error(
              updatedStock.error || "Mise a jour stock impossible"
            );
          }
          stockAvailable = {
            id: updatedStock.id,
            idProductAttribute,
            updated: true,
          };
        } else {
          const createdStock = await postStockAvailable({
            idProduct: product.id,
            idProductAttribute,
            quantity: mappedData.stock,
          });
          if (!createdStock.success) {
            throw new Error(createdStock.error || "Creation stock impossible");
          }
          stockAvailable = {
            id: createdStock.id,
            idProductAttribute,
            created: true,
          };
        }
      }

      processResult = {
        success: true,
        productReference: reference,
        productId: product.id,
        optionName: mappedData.optionName,
        valueName: mappedData.valueName,
        stock: mappedData.stock,
        priceTtc: mappedData.priceTtc,
        priceImpact: mappedData.priceImpact,
        option: mappedData.option,
        optionValue: mappedData.optionValue,
        combination,
        stockAvailable,
      };

      successes.push(processResult);
    } catch (error) {
      processResult = {
        success: false,
        productReference: row.reference?.trim(),
        optionName: row.specificité?.trim(),
        valueName: row.karazany?.trim(),
        error: error.message,
      };
      errors.push(processResult);
    }

    processedCount++;
    onProgress?.({ done: processedCount, total, result: processResult });
  }

  return { success: successes, errors };
};

export default importProductOptionsFromCSV;
