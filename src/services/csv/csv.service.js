import Papa from "papaparse";
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
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
      complete: (results) => resolve(results.data),
      error: (err) => reject(new Error(`CSV invalide : ${err.message}`)),
    });
  });
