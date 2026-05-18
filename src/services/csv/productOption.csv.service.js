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
import { postStockMovement } from "../stockMovement.service";

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

const formatDecimal = (value, decimals = 6) => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return undefined;
  }
  const str = value.toFixed(decimals).replace(/\.?(0+)$/, "");
  return str;
};

const computePriceImpact = (priceTtc, taxRate, basePriceHt) => {
  if (priceTtc === undefined || priceTtc === null) return undefined;
  const base = Number(basePriceHt);
  if (!Number.isFinite(base)) return undefined;
  const rate = Number(taxRate) || 0;
  const priceHt = priceTtc / (1 + rate / 100);
  const impact = priceHt - base;
  return Number.isFinite(impact) ? formatDecimal(impact, 6) : undefined;
};

/**
 * Trouve ou crée une option de produit.
 * @param {string} optionName - Nom de l'option (ex: "taille", "couleur")
 * @returns {Promise<{ id: string, name: string }>}
 */
const ensureProductOption = async (optionName, cache) => {
  if (!optionName) {
    throw new Error("Nom d'option manquant");
  }

  const cached = cache?.get(optionName);
  if (cached) {
    return cached;
  }

  const existing = await findProductOptionByKeyValue("name", optionName);
  if (existing.length > 0) {
    const found = { id: existing[0].id, name: existing[0].name };
    cache?.set(optionName, found);
    return found;
  }

  const created = await postProductOption({
    name: optionName,
    publicName: optionName,
    groupType: optionName,
    isColorGroup: optionName.toLowerCase() === "couleur",
    langId: 1,
  });

  if (!created.success) {
    const retry = await findProductOptionByKeyValue("name", optionName);
    if (retry.length > 0) {
      const found = { id: retry[0].id, name: retry[0].name };
      cache?.set(optionName, found);
      return found;
    }
    throw new Error(
      `Impossible de créer l'option "${optionName}": ${created.error}`
    );
  }

  const result = { id: created.id, name: optionName };
  cache?.set(optionName, result);
  return result;
};

/**
 * Trouve ou crée une valeur d'option de produit.
 * @param {string} valueName - Nom de la valeur (ex: "ngoza", "kely")
 * @returns {Promise<{ id: string, name: string }>}
 */
const ensureProductOptionValue = async (valueName, idOption, cache) => {
  if (!valueName) {
    throw new Error("Nom de valeur d'option manquant");
  }
  if (!idOption) {
    throw new Error("Id d'option manquant pour la valeur");
  }

  const cacheKey = `${idOption}::${valueName}`;
  const cached = cache?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const existing = await findProductOptionValueByKeyValue("name", valueName);
  if (existing.length > 0) {
    const found = { id: existing[0].id, name: existing[0].name };
    cache?.set(cacheKey, found);
    return found;
  }

  const created = await postProductOptionValue({
    name: valueName,
    idAttributeGroup: idOption,
    langId: 1,
  });

  if (!created.success) {
    const retry = await findProductOptionValueByKeyValue("name", valueName);
    if (retry.length > 0) {
      const found = { id: retry[0].id, name: retry[0].name };
      cache?.set(cacheKey, found);
      return found;
    }
    throw new Error(
      `Impossible de créer la valeur d'option "${valueName}": ${created.error}`
    );
  }

  const result = { id: created.id, name: valueName };
  cache?.set(cacheKey, result);
  return result;
};

/**
 * Mappe une ligne CSV en objet pour créer/mettre à jour un produit avec options.
 * @param {Object} row - Ligne parsée
 * @param {Object} product - Produit trouvé
 * @returns {Object} Données structurées
 */
const mapRowToProductOptionData = async (row, product, taxRate, caches) => {
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
    const option = await ensureProductOption(
      specificity,
      caches?.optionByName
    );
    const optionValue = await ensureProductOptionValue(
      value,
      option.id,
      caches?.optionValueByKey
    );
    result.option = option;
    result.optionValue = optionValue;
    result.attributeIds = [optionValue.id];
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
  minimalQuantity,
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
    idShop: 1,
    quantity,
    minimalQuantity,
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
  const batchSize = 10;
  let processedCount = 0;
  const caches = {
    productByReference: new Map(),
    optionByName: new Map(),
    optionValueByKey: new Map(),
  };

  const handleRow = async (row) => {
    const reference = row.reference?.trim();

    try {
      if (!reference) {
        throw new Error("Référence produit manquante");
      }

      let product = caches.productByReference.get(reference);
      if (!product) {
        const products = await findProductByKeyValue("reference", reference);
        if (!products.length) {
          throw new Error(`Produit avec référence "${reference}" non trouvé`);
        }
        product = products[0];
        caches.productByReference.set(reference, product);
      }
      const taxRate = await getTaxRateByGroupId(product.idTaxRulesGroup);

      const mappedData = await mapRowToProductOptionData(
        row,
        product,
        taxRate,
        caches
      );

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

      const idProductAttribute = combination?.id ?? 0;
      let updatedStock = null;
      if (mappedData.stock !== undefined && mappedData.stock !== null) {
        let existingStocks = await findStockAvailableByProductAttribute(
          product.id,
          idProductAttribute
        );

        if (!existingStocks.length) {
          await new Promise((r) => setTimeout(r, 300));
          existingStocks = await findStockAvailableByProductAttribute(
            product.id,
            idProductAttribute
          );
        }

        if (!existingStocks.length) {
          throw new Error(
            `stock_available introuvable pour produit ${product.id} / combinaison ${idProductAttribute}`
          );
        }

        updatedStock = await updateStockAvailable({
          id: existingStocks[0].id,
          idProduct: product.id,
          idShop: 1,
          idProductAttribute,
          quantity: mappedData.stock,
        });

        if (!updatedStock.success) {
          throw new Error(updatedStock.error || "Mise à jour stock impossible");
        }

        stockAvailable = {
          id: updatedStock.id,
          idProductAttribute,
          updated: true,
        };

        const stockMovement = await postStockMovement({
          idProduct: product.id,
          idProductAttribute,
          idStock: stockAvailable.id,
          idStockMvtReason: 1,
          physicalQuantity: mappedData.stock,
          sign: 1,
          priceTe: 0,
          dateAdd: new Date(),
        });

        if (!stockMovement.success) {
          throw new Error(
            stockMovement.error || "Creation du mouvement de stock impossible"
          );
        }
      }

      return {
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
    } catch (error) {
      return {
        success: false,
        productReference: row.reference?.trim(),
        optionName: row.specificité?.trim(),
        valueName: row.karazany?.trim(),
        error: error.message,
      };
    }
  };

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchPromises = batch.map((row) =>
      handleRow(row).then((processResult) => {
        processResult.success
          ? successes.push(processResult)
          : errors.push(processResult);
        processedCount++;
        onProgress?.({ done: processedCount, total, result: processResult });
        return processResult;
      })
    );

    await Promise.all(batchPromises);
  }

  return { success: successes, errors };
};

export default importProductOptionsFromCSV;
