import { parseCSVFile } from "./csv.service";
import {
  isPositiveNumberValue,
  isPositivePercentageValue,
  isValidDDMMYYYYDate,
  parseNumber,
} from "../../utils/utils";

const FILE_SCHEMAS = {
  products: {
    requiredColumns: [
      "date_availability_produit",
      "nom",
      "reference",
      "prix_ttc",
      "Taxe",
      "categorie",
      "prix_achat",
    ],
  },
  productOptions: {
    requiredColumns: [
      "reference",
      "specificité",
      "karazany",
      "stock_initial",
      "prix_vente_ttc",
    ],
  },
  orders: {
    requiredColumns: [
      "date",
      "nom",
      "email",
      "pwd",
      "adresse",
      "achat",
      "etat",
    ],
  },
};

// Compatibilite avec l'ancien nom utilise par l'interface.
const FILE_ALIASES = {
  options: "productOptions",
};

const REQUIRED_COLUMNS = {
  products: FILE_SCHEMAS.products.requiredColumns,
  productOptions: FILE_SCHEMAS.productOptions.requiredColumns,
  orders: FILE_SCHEMAS.orders.requiredColumns,
};

const validateColumns = (rows, requiredCols, fileLabel) => {
  const errors = [];
  if (!rows.length) {
    errors.push({
      file: fileLabel,
      line: null,
      message: "Le fichier est vide.",
    });
    return errors;
  }
  const actualCols = Object.keys(rows[0]);
  const hasExtraValues = rows.some((row) =>
    Object.prototype.hasOwnProperty.call(row, "__parsed_extra")
  );
  const extraCols = actualCols.filter(
    (col) => col !== "__parsed_extra" && !requiredCols.includes(col)
  );

  if (hasExtraValues) {
    errors.push({
      file: fileLabel,
      line: null,
      message:
        "Nombre de colonnes incohérent : certaines lignes contiennent plus de valeurs que l'en-tête.",
    });
  }

  for (const col of requiredCols) {
    if (!actualCols.includes(col)) {
      errors.push({
        file: fileLabel,
        line: null,
        message: `Colonne manquante ou non conforme : "${col}". Colonnes trouvées : ${actualCols.join(
          ", "
        )}`,
      });
    }
  }

  for (const col of extraCols) {
    errors.push({
      file: fileLabel,
      line: null,
      message: `Nom de colonne non conforme : "${col}". Colonnes attendues : ${requiredCols.join(
        ", "
      )}`,
    });
  }

  return errors;
};

const validateProductsFile = (rows) => {
  const errors = [];
  const fileLabel = "Produits";

  const colErrors = validateColumns(rows, REQUIRED_COLUMNS.products, fileLabel);
  if (colErrors.length) return colErrors;

  rows.forEach((row, i) => {
    const line = i + 2;

    if (!row.nom?.trim()) {
      errors.push({ file: fileLabel, line, message: "Nom manquant." });
    }
    if (!row.reference?.trim()) {
      errors.push({ file: fileLabel, line, message: "Référence manquante." });
    }
    if (!isPositiveNumberValue(row.prix_ttc)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Prix TTC invalide ou négatif : "${row.prix_ttc}".`,
      });
    }
    if (!isPositiveNumberValue(row.prix_achat)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Prix d'achat invalide ou négatif : "${row.prix_achat}".`,
      });
    }
    if (!isPositivePercentageValue(row.Taxe)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Taxe invalide ou négative : "${row.Taxe}".`,
      });
    }
    if (
      row.date_availability_produit &&
      !isValidDDMMYYYYDate(row.date_availability_produit)
    ) {
      errors.push({
        file: fileLabel,
        line,
        message: `Date invalide (attendu DD/MM/YYYY) : "${row.date_availability_produit}".`,
      });
    }
  });

  return errors;
};

const validateProductOptionsFile = (rows) => {
  const errors = [];
  const fileLabel = "Options produits";

  const colErrors = validateColumns(
    rows,
    REQUIRED_COLUMNS.productOptions,
    fileLabel
  );
  if (colErrors.length) return colErrors;

  rows.forEach((row, i) => {
    const line = i + 2;

    if (!row.reference?.trim()) {
      errors.push({
        file: fileLabel,
        line,
        message: "Référence produit manquante.",
      });
    }
    if (!isPositiveNumberValue(row.stock_initial)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Stock invalide ou négatif : "${row.stock_initial}".`,
      });
    }
    if (!isPositiveNumberValue(row.prix_vente_ttc)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Prix TTC invalide ou négatif : "${row.prix_vente_ttc}".`,
      });
    }
  });

  return errors;
};

// Vérifie un format de liste de tuples comme :
// [("val1";123;"val3"),("abc";45;"xyz")]
//
// Structure attendue :
// [
//   ("texte";valeur;"texte"),
//   ("texte";valeur;"texte"),
//   ...
// ]
//
// Détail :
// ^                             -> début de la chaîne
// \[\(                          -> commence par "[("
// "([^"]*)"                     -> premier champ texte entre guillemets
// ;                             -> séparateur ;
// "?([^";]+)"?                  -> deuxième champ (avec ou sans guillemets)
// ;                             -> séparateur ;
// "([^"]*)"                     -> troisième champ texte entre guillemets
// \)                            -> fermeture du tuple ")"
//
// (,\(...\))*                   -> permet plusieurs tuples séparés par des virgules
//
// \]                            -> finit par "]"
// $                             -> fin de la chaîne
//
// Exemples valides :
// [("Jean";25;"Paris")]
// [("A";123;"B"),("C";45;"D")]
// [("A";"123";"B")]

const ACHAT_FORMAT_REGEX =
  /^\[\("([^"]*)";"?([^";]+)"?;"([^"]*)"\)(,\("([^"]*)";"?([^";]+)"?;"([^"]*)"\))*\]$/;

const parseAchatColumn = (raw) => {
  if (!raw?.trim()) return [];

  const cleaned = raw
    .trim()
    .slice(1, -1)
    .replace(/""([^"]+)""/g, '"$1"'); // ← seulement ""valeur"", pas "" seul

  const items = [];
  const tupleRegex = /\("([^"]*)";"?([^";)]+)"?;"([^"]*)"\)/g;

  let match;
  while ((match = tupleRegex.exec(cleaned)) !== null) {
    items.push({
      reference: match[1],
      quantity: parseInt(parseNumber(match[2])),
      karazany: match[3] || null,
    });
  }
  console.log(items);

  return items;
};

const isValidAchatFormat = (raw) => ACHAT_FORMAT_REGEX.test(String(raw).trim());

const validateOrdersFile = (rows) => {
  const errors = [];
  const fileLabel = "Clients et achats";

  const colErrors = validateColumns(rows, REQUIRED_COLUMNS.orders, fileLabel);
  if (colErrors.length) return colErrors;

  rows.forEach((row, i) => {
    const line = i + 2;

    if (!row.email?.trim()) {
      errors.push({ file: fileLabel, line, message: "Email manquant." });
    }
    if (!row.date?.trim()) {
      errors.push({ file: fileLabel, line, message: "Date manquante." });
    } else if (!isValidDDMMYYYYDate(row.date)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Date invalide (attendu DD/MM/YYYY) : "${row.date}".`,
      });
    }
    if (!row.achat?.trim()) {
      errors.push({
        file: fileLabel,
        line,
        message: "Colonne achat manquante ou vide.",
      });
    } else if (!isValidAchatFormat(row.achat)) {
      errors.push({
        file: fileLabel,
        line,
        message: `Colonne achat invalide : "${row.achat}". Format attendu : [("REFERENCE";quantité;"karazany")].`,
      });
    } else {
      const items = parseAchatColumn(row.achat);
      if (!items.length) {
        errors.push({
          file: fileLabel,
          line,
          message: `Colonne achat invalide : "${row.achat}".`,
        });
      }

      items.forEach((item) => {
        if (
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isInteger(item.quantity)
        ) {
          errors.push({
            file: fileLabel,
            line,
            message: `Quantité d'achat invalide ou non positive pour "${item.reference}".`,
          });
        }
      });
    }
  });

  return errors;
};

export const validateAllFiles = async (files) => {
  const allErrors = [];
  const normalizedFiles = Object.entries(files || {}).reduce(
    (acc, [key, file]) => {
      acc[FILE_ALIASES[key] || key] = file;
      return acc;
    },
    {}
  );

  if (normalizedFiles.products) {
    const rows = await parseCSVFile(normalizedFiles.products);
    allErrors.push(...validateProductsFile(rows));
  }

  if (normalizedFiles.productOptions) {
    const rows = await parseCSVFile(normalizedFiles.productOptions);
    allErrors.push(...validateProductOptionsFile(rows));
  }

  if (normalizedFiles.orders) {
    const rows = await parseCSVFile(normalizedFiles.orders);
    allErrors.push(...validateOrdersFile(rows));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
};
