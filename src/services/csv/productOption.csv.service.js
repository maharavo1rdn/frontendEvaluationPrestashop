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
import { parseNumber } from "../../utils/utils";

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
const mapRowToProductOptionData = async (row, product) => {
  const specificity = row.specificité?.trim();
  const value = row.karazany?.trim();
  const initialStock = parseNumber(row.stock_initial ?? row.stock_initial);
  const priceTtc = parseNumber(row.prix_vente_ttc ?? row.prix_vente_ttc);

  const result = {
    productId: product.id,
    productReference: row.reference?.trim(),
    optionName: specificity,
    valueName: value,
    stock: initialStock,
    priceTtc: priceTtc,
    hasOption: !!(specificity && value),
  };

  if (result.hasOption) {
    const option = await ensureProductOption(specificity);
    const optionValue = await ensureProductOptionValue(value);
    result.option = option;
    result.optionValue = optionValue;
  }

  return result;
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

      const mappedData = await mapRowToProductOptionData(row, product);

      processResult = {
        success: true,
        productReference: reference,
        productId: product.id,
        optionName: mappedData.optionName,
        valueName: mappedData.valueName,
        stock: mappedData.stock,
        priceTtc: mappedData.priceTtc,
        option: mappedData.option,
        optionValue: mappedData.optionValue,
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
