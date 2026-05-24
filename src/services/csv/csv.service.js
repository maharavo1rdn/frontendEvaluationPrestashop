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

export const exportCsv = (
  columns,
  data,
  delimiter = ",",
  name = "exportCsv"
) => {
  const normalizedColumns = Array.isArray(columns)
    ? columns.map((column) =>
        typeof column === "string" ? { key: column, header: column } : column
      )
    : [];

  const rows = normalizedColumns.length
    ? data.map((row) =>
        Object.fromEntries(
          normalizedColumns.map(({ key, header }) => [
            header ?? key,
            row?.[key] ?? "",
          ])
        )
      )
    : data;

  const options = {
    header: true,
    quotes: false,
    delimiter: delimiter,
  };
  const csv = Papa.unparse(rows, options);

  const csvWithBOM = "\uFEFF" + csv;
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
