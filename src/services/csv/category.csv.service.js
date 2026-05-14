import { parseCSVFile } from "./csv.service";
import { postCategory } from "../category.service";
/**
 * Mappe une ligne CSV en objet catégorie attendu par buildCategoryXML.
 * @param {Object} row - Ligne parsée par PapaParse
 * @returns {Object}
 */
export const mapRowToCategory = (row) => ({
  name: row.name,
  idParent: row.id_parent ? Number(row.id_parent) : 2,
  active: row.active ? row.active !== "0" : true,
  position: row.position ? Number(row.position) : undefined,
  description: row.description || undefined,
  metaTitle: row.metaTitle || undefined,
  metaDescription: row.metaDescription || undefined,
  metaKeywords: row.metaKeywords || undefined,
  langId: row.langId ? Number(row.langId) : 1,
});

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
export const importCategoriesFromCSV = async (file, onProgress) => {
  const rows = await parseCSVFile(file);
  const total = rows.length;
  const successes = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const category = mapRowToCategory(row);
    
    const result = await postCategory(category);

    result.success ? successes.push(result) : errors.push(result);

    onProgress?.({ done: i + 1, total, result });
  }

  return { success: successes, errors };
};
