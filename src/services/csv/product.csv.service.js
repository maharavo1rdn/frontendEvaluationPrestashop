import { findCategoryByKeyValue } from "../category.service";
import { findManufacturerByKeyValue } from "../manufacturer.service";
import { postProduct } from "../product.service";
import { parseCSVFile } from "./csv.service";
/**
 * Mappe une ligne CSV en objet catégorie attendu par buildCategoryXML.
 * @param {Object} row - Ligne parsée par PapaParse
 * @returns {Object}
 */
export const mapRowToProduct = async (row) => {
  const categories = await findCategoryByKeyValue("name", row.category_name);
  const id_category_default =
    categories.length > 0 ? Number(categories[0].id) : undefined;
  const manufacturers = await findManufacturerByKeyValue(
    "name",
    row.manufacturer_name
  );
  const id_manufacturer =
    manufacturers.length > 0 ? Number(manufacturers[0].id) : undefined;
  return {
    name: row.name,
    reference: row.reference,
    price: row.price ? Number(row.price) : undefined,
    active: row.active ? row.active !== "0" : true,
    description: row.description || undefined,
    category_name: row.category_name ? row.category_name : "",
    categoryId: id_category_default,
    manufacturerId: id_manufacturer,
    manufacturer_name: row.manufacturer_name ? row.manufacturer_name : "",
    weight: row.weight ? Number(row.weight) : undefined,
    quantity: row.quantity ? Number(row.quantity) : undefined,
    langId: row.langId ? Number(row.langId) : 1,
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
    const product = await mapRowToProduct(row);

    const result = await postProduct(product);

    result.success ? successes.push(result) : errors.push(result);

    onProgress?.({ done: i + 1, total, result });
  }

  return { success: successes, errors };
};
