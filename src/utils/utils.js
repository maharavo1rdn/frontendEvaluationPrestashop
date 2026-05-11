export const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = String(value).trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[%\s\u00A0]/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    const digits = cleaned.replace(/[^0-9]/g, "");
    const numeric = parseFloat(digits);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  const integerPart = cleaned
    .slice(0, decimalIndex)
    .replace(/[^0-9]/g, "");
  const fractionalPart = cleaned
    .slice(decimalIndex + 1)
    .replace(/[^0-9]/g, "");

  const normalized = `${integerPart}.${fractionalPart}`;
  const numeric = parseFloat(normalized);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const parsePercentage = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  return parseNumber(String(value).replace(/%/g, ""));
};

const pad2 = (value) => String(value).padStart(2, "0");

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
