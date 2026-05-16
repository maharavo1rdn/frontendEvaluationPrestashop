import Papa from "papaparse";
import { normalizeCSVHeader } from "../../utils/utils";
/**
 * Lit un fichier CSV (File object) et retourne un tableau de lignes parsées.
 * @param {File} file
 * @returns {Promise<Object[]>}
 */
export const parseCSVFile = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeCSVHeader,
      transform: (v) => v.trim(),
      complete: (results) => resolve(results.data),
      error: (err) => reject(new Error(`CSV invalide : ${err.message}`)),
    });
  });
