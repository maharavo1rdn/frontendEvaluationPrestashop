export const CSV_IMPORT_COLUMNS = [
  "date_availability_produit",
  "nom",
  "reference",
  "prix_ttc",
  "Taxe",
  "categorie",
  "prix_achat",
  "specificité",
  "karazany",
  "stock_initial",
  "prix_vente_ttc",
  "date",
  "email",
  "pwd",
  "adresse",
  "achat",
  "etat",
];

export const normalizeCSVHeader = (header) => {
  const trimmed = String(header ?? "").trim();
  const match = CSV_IMPORT_COLUMNS.find(
    (column) => column.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? trimmed;
};

export const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = String(value).trim();
  if (!raw) return 0;
  if (!/^-?[0-9,.\s\u00A0%]+$/.test(raw)) return Number.NaN;
  if (raw.slice(1).includes("-")) return Number.NaN;

  const isNegative = raw.startsWith("-");
  const cleaned = raw.replace(/^-/, "").replace(/[%\s\u00A0]/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    const digits = cleaned.replace(/[^0-9]/g, "");
    const numeric = parseFloat(digits);
    if (Number.isNaN(numeric)) return Number.NaN;
    return isNegative ? -numeric : numeric;
  }

  const integerPart = cleaned.slice(0, decimalIndex).replace(/[^0-9]/g, "");
  const fractionalPart = cleaned.slice(decimalIndex + 1).replace(/[^0-9]/g, "");

  const normalized = `${integerPart}.${fractionalPart}`;
  const numeric = parseFloat(normalized);
  if (Number.isNaN(numeric)) return Number.NaN;
  return isNegative ? -numeric : numeric;
};

export const parsePercentage = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  return parseNumber(String(value).replace(/%/g, ""));
};

export const isPositiveNumberValue = (value, { allowEmpty = true } = {}) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return allowEmpty;
  }
  const numeric = parseNumber(value);
  return Number.isFinite(numeric) && numeric >= 0;
};

export const isPositivePercentageValue = (
  value,
  { allowEmpty = true } = {}
) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return allowEmpty;
  }
  const numeric = parsePercentage(value);
  return Number.isFinite(numeric) && numeric >= 0;
};

const pad2 = (value) => String(value).padStart(2, "0");

export const isValidDDMMYYYYDate = (value) => {
  if (!value?.trim()) return false;
  const raw = String(value).trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return false;

  const [day, month, year] = raw.split("/");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
};

export const parseDate = (dateStr) => {
  if (dateStr === null || dateStr === undefined) return null;
  const raw = String(dateStr).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parts = raw.split(/[\/\.\-]/).filter(Boolean);
  if (parts.length !== 3) return null;

  const [first, second, third] = parts;

  if (first.length === 4) {
    return `${first}-${pad2(second)}-${pad2(third)}`;
  }

  if (third.length === 4) {
    return `${third}-${pad2(second)}-${pad2(first)}`;
  }

  const year = third.length === 2 ? `20${third}` : third;
  return `${year}-${pad2(second)}-${pad2(first)}`;
};

export const formatDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const parseDateWithSeparator = (date, separator = "/") => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}${separator}${month}${separator}${year}`;
};
