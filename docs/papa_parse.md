# PapaParse — Guide complet et gestion des cas problématiques

## Sommaire

- [PapaParse — Guide complet et gestion des cas problématiques](#papaparse--guide-complet-et-gestion-des-cas-problématiques)
  - [Sommaire](#sommaire)
  - [1. Qu'est-ce que PapaParse](#1-quest-ce-que-papaparse)
  - [2. Installation et import](#2-installation-et-import)
  - [3. Fonctionnement général](#3-fonctionnement-général)
  - [4. Les options essentielles](#4-les-options-essentielles)
  - [5. L'objet résultat](#5-lobjet-résultat)
    - [results.data](#resultsdata)
    - [results.errors](#resultserrors)
    - [results.meta](#resultsmeta)
  - [6. Les deux modes de parsing](#6-les-deux-modes-de-parsing)
    - [Mode synchrone — chaîne de texte](#mode-synchrone--chaîne-de-texte)
    - [Mode asynchrone — fichier (obligatoire pour File object)](#mode-asynchrone--fichier-obligatoire-pour-file-object)
  - [7. Gestion des cas problématiques](#7-gestion-des-cas-problématiques)
    - [7.1 Nombres décimaux](#71-nombres-décimaux)
    - [7.2 Espaces dans les nombres](#72-espaces-dans-les-nombres)
    - [7.3 Conflit délimiteur et décimale](#73-conflit-délimiteur-et-décimale)
    - [7.4 Valeurs vides ou manquantes](#74-valeurs-vides-ou-manquantes)
    - [7.5 Booléens non standards](#75-booléens-non-standards)
    - [7.6 En-têtes avec espaces ou majuscules](#76-en-têtes-avec-espaces-ou-majuscules)
    - [7.7 Encodage et caractères spéciaux](#77-encodage-et-caractères-spéciaux)
    - [7.8 Lignes incomplètes](#78-lignes-incomplètes)
    - [7.9 Guillemets mal formés](#79-guillemets-mal-formés)
    - [7.10 Doublons dans le fichier](#710-doublons-dans-le-fichier)
  - [8. Utilitaire complet de nettoyage](#8-utilitaire-complet-de-nettoyage)
  - [9. Validation avant import](#9-validation-avant-import)
  - [10. Intégration dans un service d'import](#10-intégration-dans-un-service-dimport)
  - [11. Récapitulatif des cas gérés](#11-récapitulatif-des-cas-gérés)

---

## 1. Qu'est-ce que PapaParse

PapaParse est la librairie JavaScript de référence pour lire et écrire des fichiers CSV.
Elle prend en entrée un fichier, une URL ou une chaîne de texte, et retourne un
**tableau d'objets JavaScript** directement exploitables.

```
Fichier .csv  →  PapaParse  →  [{ col1: val1, col2: val2 }, ...]
```

Sans PapaParse, parser manuellement un CSV avec `split(",")` échoue dès qu'une valeur
contient une virgule entre guillemets. PapaParse gère ces cas automatiquement.

---

## 2. Installation et import

```bash
npm install papaparse
```

```js
import Papa from "papaparse";
```

---

## 3. Fonctionnement général

PapaParse lit le fichier ligne par ligne :

1. **Ligne 1** (si `header: true`) → noms des colonnes
2. **Lignes suivantes** → valeurs associées aux colonnes
3. Chaque ligne devient un **objet JavaScript**

```
CSV :
name,price,active
T-Shirt,19.99,true
Jean,49.99,false

Résultat avec header: true :
[
  { name: "T-Shirt", price: "19.99", active: "true" },
  { name: "Jean",    price: "49.99", active: "false" },
]
```

> ⚠️ **Important** : par défaut tout est retourné en string.
> "19.99" n'est pas 19.99 et "true" n'est pas true.
> C'est volontaire — la conversion manuelle dans un mapper est plus sûre.

---

## 4. Les options essentielles

```js
Papa.parse(file, {

  // Structure
  header: true,
  // true  → ligne 1 = colonnes, data = tableau d'objets { col: val }
  // false → data = tableau de tableaux [["val1", "val2"]]

  delimiter: ",",
  // Séparateur de colonnes. Défaut : auto-détecté.
  // Valeurs courantes : "," (anglais), ";" (Excel français), "\t" (TSV)

  newline: "",
  // Fin de ligne. Défaut : auto-détecté (\n, \r\n, \r)

  // Nettoyage
  skipEmptyLines: true,
  // true     → ignore les lignes entièrement vides
  // "greedy" → ignore aussi les lignes avec seulement des espaces

  transformHeader: (header) => header.trim().toLowerCase(),
  // Transforme les noms de colonnes. Appliqué une fois sur la ligne d'en-tête.

  transform: (value, column) => value.trim(),
  // Transforme chaque valeur individuelle. Reçoit la valeur et le nom de colonne.

  // Typage
  dynamicTyping: false,
  // true  → "19.99" → 19.99, "true" → true, "" → null (automatique)
  // false → tout reste string (recommandé pour les imports — plus de contrôle)

  // Aperçu
  preview: 0,
  // 0 = toutes les lignes. N = seulement les N premières.

  // Callbacks
  complete: (results, file) => { },
  error:    (error, file)   => { },
  step:     (row, parser)   => { },  // mode streaming ligne par ligne

  // Encodage
  encoding: "UTF-8",
  // Changer en "ISO-8859-1" pour les vieux exports Excel français.
});
```

---

## 5. L'objet résultat

```js
{
  data:   [],   // tableau de lignes (objets ou tableaux selon header)
  errors: [],   // erreurs non fatales rencontrées pendant le parsing
  meta:   {},   // métadonnées du fichier
}
```

### results.data

```js
// Avec header: true
[
  { name: "T-Shirt", price: "19.99", active: "true" },
  { name: "Jean",    price: "49.99", active: "false" },
]
```

### results.errors

```js
[
  {
    type:    "FieldMismatch",   // Quotes | Delimiter | FieldMismatch
    code:    "TooManyFields",
    message: "Trop de champs à la ligne 3",
    row:     2,                 // index 0-based
  }
]
```

### results.meta

```js
{
  delimiter: ",",
  linebreak:  "\r\n",
  aborted:    false,
  fields:     ["name", "price", "active"],
  truncated:  false,
}
```

---

## 6. Les deux modes de parsing

### Mode synchrone — chaîne de texte

```js
const csv    = `name,price\nT-Shirt,19.99`;
const result = Papa.parse(csv, { header: true });
console.log(result.data);
// [{ name: "T-Shirt", price: "19.99" }]
```

### Mode asynchrone — fichier (obligatoire pour File object)

```js
// Encapsulation Promise réutilisable dans tous les services
export const parseCSVFile = (file, options = {}) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: (h) => h.trim(),
      transform:       (v) => v.trim(),
      ...options,
      complete: (results) => {
        if (results.errors.length)
          console.warn("Avertissements CSV :", results.errors);
        resolve(results.data);
      },
      error: (err) => reject(new Error(`Erreur parsing : ${err.message}`)),
    });
  });

// Utilisation avec async/await
const rows = await parseCSVFile(file);
```

---

## 7. Gestion des cas problématiques

### 7.1 Nombres décimaux

**Problème** : un nombre décimal peut utiliser `.` (anglais) ou `,` (français).
PapaParse retourne tout en string, la conversion doit être explicite.

```
CSV anglais  : 19.99  → parseFloat("19.99") = 19.99  ✅
CSV français : 19,99  → parseFloat("19,99") = 19      ❌ (la virgule est ignorée)
```

**Solution** :

```js
/**
 * Convertit une valeur en nombre flottant.
 * Gère les deux formats décimaux : "12.2" et "12,2".
 * Gère aussi les espaces comme séparateurs de milliers : "1 200,50".
 *
 * @param {any}    value    - Valeur brute du CSV
 * @param {number} fallback - Valeur si conversion impossible (défaut : 0)
 * @returns {number}
 */
export const parseDecimal = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;

  const str = String(value).trim();

  // Cas : "1.200,50" (format européen avec point comme séparateur de milliers)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    const normalized = str.replace(/\./g, "").replace(",", ".");
    const parsed     = parseFloat(normalized);
    return isNaN(parsed) ? fallback : parsed;
  }

  // Cas standard : remplacer la virgule décimale par un point
  const normalized = str
    .replace(/\s/g, "")    // espaces (1 000,50 → 1000,50)
    .replace(",", ".");    // virgule → point (12,2 → 12.2)

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? fallback : parsed;
};
```

```js
// Exemples
parseDecimal("19.99")      // → 19.99  ✅
parseDecimal("19,99")      // → 19.99  ✅
parseDecimal("1 200,50")   // → 1200.5 ✅
parseDecimal("1.200,50")   // → 1200.5 ✅
parseDecimal("")           // → 0      ✅
parseDecimal("abc")        // → 0      ✅
parseDecimal("abc", null)  // → null   ✅ (fallback personnalisé)
```

---

### 7.2 Espaces dans les nombres

**Problème** : les nombres longs sont souvent formatés avec des espaces dans les tableurs.

```
"1 200"    → séparateur de milliers (espace normal)
"1 200"    → espace insécable (alt+espace sous Excel — invisible !)
"1,200.50" → format anglais avec virgule comme séparateur de milliers
```

**Solution** :

```js
/**
 * Supprime tous les séparateurs de milliers et normalise un nombre.
 *
 * @param {any} value
 * @returns {string} - Nombre normalisé prêt pour parseFloat
 */
export const cleanNumber = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .trim()
    .replace(/\u00A0/g, "")  // espace insécable (fréquent dans Excel)
    .replace(/\u202F/g, "")  // espace fine insécable
    .replace(/\s/g,    "")   // autres espaces
    .replace(/^(\d{1,3})(,\d{3})+(\.\d+)?$/, (m) =>
      m.replace(/,/g, "")    // "1,200.50" → "1200.50" (format anglais)
    )
    .replace(",", ".");       // virgule décimale → point
};

// Combiné avec parseDecimal
export const parseDecimal = (value, fallback = 0) => {
  const parsed = parseFloat(cleanNumber(value));
  return isNaN(parsed) ? fallback : parsed;
};
```

```js
// Exemples
cleanNumber("1 200,50")   // → "1200.50"
cleanNumber("1\u00A050")  // → "150"   (espace insécable supprimé)
cleanNumber("1,200.50")   // → "1200.50"
cleanNumber("  42  ")     // → "42"
```

---

### 7.3 Conflit délimiteur et décimale

**Problème** : quand le délimiteur CSV est `,` ET que les décimales utilisent aussi `,`.

```csv
name,price,active
T-Shirt,12,2,true    ← PapaParse voit 4 colonnes au lieu de 3 !
```

**Solution 1 — Détecter automatiquement le délimiteur** :

```js
/**
 * Détecte le délimiteur d'un CSV en analysant la première ligne.
 *
 * @param {string} firstLine - Première ligne du fichier
 * @returns {"," | ";" | "\t"}
 */
export const detectDelimiter = (firstLine) => {
  const counts = {
    ",":  (firstLine.match(/,/g)  || []).length,
    ";":  (firstLine.match(/;/g)  || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
};

export const parseCSVFile = (file, options = {}) =>
  new Promise((resolve, reject) => {
    const previewReader = new FileReader();
    previewReader.onload = (e) => {
      const firstLine = e.target.result.split(/\r?\n/)[0];
      const delimiter = detectDelimiter(firstLine);

      Papa.parse(file, {
        header:          true,
        skipEmptyLines:  true,
        delimiter,                   // ← détecté automatiquement
        transformHeader: (h) => h.trim(),
        transform:       (v) => v.trim(),
        ...options,
        complete: (results) => resolve(results.data),
        error:    (err)     => reject(new Error(err.message)),
      });
    };
    previewReader.readAsText(file.slice(0, 500));
  });
```

**Solution 2 — Valider la cohérence des colonnes** :

```js
/**
 * Vérifie que toutes les lignes ont le bon nombre de colonnes.
 *
 * @param {Object[]} rows           - Lignes parsées
 * @param {string[]} expectedFields - Colonnes attendues
 * @returns {{ valid: boolean, badRows: Object[], suggestion: string }}
 */
export const validateColumnCount = (rows, expectedFields) => {
  const expected = expectedFields.length;
  const badRows  = rows.reduce((acc, row, i) => {
    const actual = Object.keys(row).length;
    if (actual !== expected)
      acc.push({ line: i + 2, expected, actual });
    return acc;
  }, []);

  return {
    valid:      badRows.length === 0,
    badRows,
    suggestion: badRows.length > 0
      ? "Vérifiez les décimales (point vs virgule) et le délimiteur."
      : "",
  };
};
```

---

### 7.4 Valeurs vides ou manquantes

**Problème** : une cellule vide peut devenir `""`, `null`, `undefined` ou `"NULL"`.

```csv
name,description,price
T-Shirt,,19.99       ← description vide → ""
Jean,NULL,49.99      ← export SQL → "NULL" (string)
Veste,N/A,129.99     ← valeur inconnue → "N/A" (string)
```

**Solution** :

```js
const EMPTY_VALUES = new Set(["", "null", "undefined", "n/a", "na", "-", "—", "none"]);

/**
 * Retourne null si la valeur est considérée vide, sinon la valeur nettoyée.
 */
export const cleanString = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return EMPTY_VALUES.has(str.toLowerCase()) ? fallback : str;
};

/**
 * Version pour les champs optionnels : retourne undefined si vide.
 * Évite d'envoyer des balises vides à PrestaShop.
 */
export const optionalString = (value) => cleanString(value, undefined);
```

```js
cleanString("")        // → null
cleanString("NULL")    // → null
cleanString("N/A")     // → null
cleanString("T-Shirt") // → "T-Shirt"
optionalString("")     // → undefined
```

---

### 7.5 Booléens non standards

**Problème** : `true`/`false` s'écrivent de dizaines de façons différentes.

```csv
active
true    ← JS standard
TRUE    ← majuscules
1       ← numérique
oui     ← français
yes     ← anglais
on      ← HTML checkbox
```

**Solution** :

```js
const TRUE_VALUES  = new Set(["true",  "1", "yes", "oui", "vrai", "on", "y", "o"]);
const FALSE_VALUES = new Set(["false", "0", "no",  "non", "faux", "off", "n"]);

/**
 * Convertit une valeur CSV en booléen.
 *
 * @param {any}     value    - Valeur brute
 * @param {boolean} fallback - Valeur par défaut si non reconnu
 * @returns {boolean}
 */
export const parseBoolean = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  const str = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(str))  return true;
  if (FALSE_VALUES.has(str)) return false;
  return fallback;
};
```

```js
parseBoolean("true")   // → true
parseBoolean("oui")    // → true
parseBoolean("1")      // → true
parseBoolean("non")    // → false
parseBoolean("maybe")  // → false (fallback)
parseBoolean("", true) // → true  (fallback personnalisé)
```

---

### 7.6 En-têtes avec espaces ou majuscules

**Problème** : les en-têtes viennent souvent avec des formulations variables.

```
"  Name  "   ← espaces entourants
"ID Parent"  ← espace dans le nom
"PRICE"      ← tout en majuscules
"Méta Titre" ← accents et espaces
```

**Solution** :

```js
/**
 * Normalise un nom de colonne en clé JavaScript camelCase valide.
 * "  ID Parent  " → "idParent"
 * "Méta Titre"    → "metaTitre"
 */
export const normalizeHeader = (header) =>
  header
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // supprime les accents
    .replace(/[^a-zA-Z0-9\s_]/g, "")    // supprime les caractères spéciaux
    .trim()
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())  // camelCase
    .replace(/^(.)/, (c) => c.toLowerCase());        // 1ère lettre minuscule

// Dans PapaParse
Papa.parse(file, {
  header:          true,
  transformHeader: normalizeHeader,
});
```

```js
normalizeHeader("  Name  ")          // → "name"
normalizeHeader("ID Parent")         // → "idParent"
normalizeHeader("Méta Titre")        // → "metaTitre"
normalizeHeader("description_short") // → "descriptionShort"
```

---

### 7.7 Encodage et caractères spéciaux

**Problème** : les vieux exports Excel utilisent ISO-8859-1.
Les accents apparaissent comme `VÃªtements` au lieu de `Vêtements`.

```js
/**
 * Détecte l'encodage probable d'un fichier à partir de ses premiers octets.
 * Le BOM UTF-8 est 0xEF 0xBB 0xBF.
 */
export const detectEncoding = (buffer) => {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF)
    return "UTF-8";
  for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
    if (bytes[i] > 0x7F) {
      const isUTF8 =
        (bytes[i] & 0xE0) === 0xC0 &&
        i + 1 < bytes.length &&
        (bytes[i + 1] & 0xC0) === 0x80;
      if (!isUTF8) return "ISO-8859-1";
    }
  }
  return "UTF-8";
};

// Dans parseCSVFile
const detectReader = new FileReader();
detectReader.onload = (e) => {
  const encoding = detectEncoding(e.target.result);
  Papa.parse(file, { encoding, ... });
};
detectReader.readAsArrayBuffer(file.slice(0, 1000));
```

---

### 7.8 Lignes incomplètes

**Problème** : une ligne peut avoir moins de colonnes que l'en-tête.

```csv
name,price,active,description
T-Shirt,19.99,true,Un super t-shirt
Jean,49.99                           ← active et description manquants
```

PapaParse génère `{ active: undefined, description: undefined }`.

**Solution** :

```js
/**
 * Complète les champs manquants d'une ligne avec des valeurs par défaut.
 *
 * @param {Object} row      - Ligne parsée
 * @param {Object} defaults - Valeurs par défaut par colonne
 * @returns {Object}
 */
export const fillMissingFields = (row, defaults = {}) => {
  const filled = { ...row };
  for (const [key, def] of Object.entries(defaults)) {
    if (filled[key] === undefined || filled[key] === null || filled[key] === "") {
      filled[key] = def;
    }
  }
  return filled;
};
```

```js
// Dans le mapper produit
const filled = fillMissingFields(row, {
  active:      "true",
  type:        "simple",
  description: "",
  weight:      "0",
  quantity:    "0",
});
```

---

### 7.9 Guillemets mal formés

**Problème** : guillemets non doublés dans les valeurs.

```csv
"T-Shirt","Coton "bio" certifié"   ← cassé → erreur type "Quotes"
"Jean","Slim fit"                   ← correct
```

**Solution** :

```js
/**
 * Parse avec tolérance aux erreurs de guillemets.
 */
export const parseCSVTolerant = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: normalizeHeader,
      transform:       (v) => v.trim(),
      complete: (results) => {
        const warnings = results.errors.filter(
          (e) => e.type === "Quotes" || e.type === "FieldMismatch"
        );
        const fatals = results.errors.filter(
          (e) => e.type !== "Quotes" && e.type !== "FieldMismatch"
        );

        if (fatals.length > 0)
          return reject(new Error(`Erreur fatale : ${fatals[0].message}`));

        if (warnings.length > 0)
          console.warn(
            `${warnings.length} ligne(s) avec des guillemets incorrects :`,
            warnings.map((w) => `ligne ${w.row + 2}`).join(", ")
          );

        resolve({ rows: results.data, warnings });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
```

---

### 7.10 Doublons dans le fichier

**Problème** : deux lignes avec la même référence.

```csv
reference,name,price
REF-001,T-Shirt,19.99
REF-001,T-Shirt Bleu,24.99   ← doublon !
```

**Solution** :

```js
/**
 * Détecte et supprime les doublons dans un tableau de lignes.
 *
 * @param {Object[]} rows     - Lignes parsées
 * @param {string}   keyField - Colonne servant de clé unique
 * @returns {{ unique: Object[], duplicates: Object[] }}
 */
export const deduplicateRows = (rows, keyField) => {
  const seen       = new Map();
  const unique     = [];
  const duplicates = [];

  for (const row of rows) {
    const key = cleanString(row[keyField]);
    if (!key) { unique.push(row); continue; }
    if (seen.has(key)) {
      duplicates.push({ ...row, _duplicateOf: key });
    } else {
      seen.set(key, true);
      unique.push(row);
    }
  }

  return { unique, duplicates };
};
```

---

## 8. Utilitaire complet de nettoyage

```js
// src/utils/csv.utils.js

const EMPTY_VALUES = new Set(["", "null", "undefined", "n/a", "na", "-", "—", "none"]);
const TRUE_VALUES  = new Set(["true", "1", "yes", "oui", "vrai", "on", "y", "o"]);
const FALSE_VALUES = new Set(["false", "0", "no", "non", "faux", "off", "n"]);

// Strings
export const cleanString    = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return EMPTY_VALUES.has(str.toLowerCase()) ? fallback : str;
};
export const optionalString = (value) => cleanString(value, undefined);

export const normalizeHeader = (header) =>
  header.trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s_]/g, "").trim()
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toLowerCase());

// Nombres
export const cleanNumber = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim()
    .replace(/\u00A0/g, "").replace(/\u202F/g, "").replace(/\s/g, "")
    .replace(/^(\d{1,3})(,\d{3})+(\.\d+)?$/, (m) => m.replace(/,/g, ""))
    .replace(",", ".");
};
export const parseDecimal  = (value, fallback = 0) => {
  const p = parseFloat(cleanNumber(value));
  return isNaN(p) ? fallback : p;
};
export const parseInteger  = (value, fallback = 0) => {
  const p = parseInt(cleanNumber(value), 10);
  return isNaN(p) ? fallback : p;
};

// Booléens
export const parseBoolean = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  const str = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(str))  return true;
  if (FALSE_VALUES.has(str)) return false;
  return fallback;
};

// Lignes
export const fillMissingFields = (row, defaults = {}) => {
  const filled = { ...row };
  for (const [key, def] of Object.entries(defaults))
    if (filled[key] === undefined || filled[key] === null || filled[key] === "")
      filled[key] = def;
  return filled;
};

export const deduplicateRows = (rows, keyField) => {
  const seen = new Map(); const unique = []; const duplicates = [];
  for (const row of rows) {
    const key = cleanString(row[keyField]);
    if (!key) { unique.push(row); continue; }
    if (seen.has(key)) duplicates.push({ ...row, _duplicateOf: key });
    else { seen.set(key, true); unique.push(row); }
  }
  return { unique, duplicates };
};

// Validation
export const validateColumnCount = (rows, expectedFields) => {
  const expected = expectedFields.length;
  const badRows  = rows.reduce((acc, row, i) => {
    const actual = Object.keys(row).length;
    if (actual !== expected) acc.push({ line: i + 2, expected, actual });
    return acc;
  }, []);
  return {
    valid:      badRows.length === 0,
    badRows,
    suggestion: badRows.length > 0
      ? "Vérifiez les décimales (point vs virgule) et le délimiteur."
      : "",
  };
};

// Détection
export const detectDelimiter = (firstLine) => {
  const counts = {
    ",":  (firstLine.match(/,/g)  || []).length,
    ";":  (firstLine.match(/;/g)  || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
};
```

---

## 9. Validation avant import

```js
// src/utils/csv.validators.js

export const validateProductRow = (row, index) => {
  const errors = [];
  const line   = `Ligne ${index + 2}`;

  if (!row.name)
    errors.push(`${line} — "name" est obligatoire`);

  if (!row.reference)
    errors.push(`${line} — "reference" est obligatoire`);

  if (row.price === null || isNaN(row.price) || row.price < 0)
    errors.push(`${line} — "price" invalide : "${row.price}"`);

  if (!["simple", "combinations", "virtual"].includes(row.type))
    errors.push(`${line} — "type" invalide : "${row.type}"`);

  return errors;
};

export const validateRows = (rows, validateFn) => {
  const allErrors = rows.flatMap((row, i) => validateFn(row, i));
  return {
    valid:  allErrors.length === 0,
    errors: allErrors,
    report: allErrors.length > 0
      ? `${allErrors.length} erreur(s) :\n${allErrors.join("\n")}`
      : "Fichier valide",
  };
};
```

---

## 10. Intégration dans un service d'import

```js
// src/services/product.import.service.js

import Papa from "papaparse";
import { buildProductXML } from "./product.builder";
import {
  cleanString, optionalString,
  parseDecimal, parseInteger, parseBoolean,
  normalizeHeader, detectDelimiter,
  fillMissingFields, deduplicateRows, validateColumnCount,
} from "../utils/csv.utils";
import { validateProductRow, validateRows } from "../utils/csv.validators";

const BASE_URL = import.meta.env.VITE_API_URL;
const WS_KEY   = import.meta.env.VITE_WS_KEY;

const EXPECTED_COLUMNS = [
  "name", "reference", "price", "active",
  "type", "description", "categoryName",
  "manufacturerName", "weight", "quantity",
];

const DEFAULTS = {
  active:           "true",
  type:             "simple",
  description:      "",
  weight:           "0",
  quantity:         "0",
  categoryName:     "",
  manufacturerName: "",
};

const parseCSVFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const delimiter = detectDelimiter(e.target.result.split(/\r?\n/)[0]);
      Papa.parse(file, {
        header:          true,
        skipEmptyLines:  true,
        delimiter,
        transformHeader: normalizeHeader,
        transform:       (v) => v.trim(),
        complete: (r) => resolve({ rows: r.data, warnings: r.errors }),
        error:    (e) => reject(new Error(e.message)),
      });
    };
    reader.readAsText(file.slice(0, 500));
  });

const mapRowToProduct = (row) => {
  const f = fillMissingFields(row, DEFAULTS);
  return {
    name:             cleanString(f.name),
    reference:        cleanString(f.reference),
    price:            parseDecimal(f.price),
    active:           parseBoolean(f.active, true),
    type:             cleanString(f.type, "simple"),
    description:      optionalString(f.description),
    categoryName:     optionalString(f.categoryName),
    manufacturerName: optionalString(f.manufacturerName),
    weight:           parseDecimal(f.weight),
    quantity:         parseInteger(f.quantity),
  };
};

const postProduct = async (product) => {
  const res = await fetch(`${BASE_URL}/products?output_format=XML`, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${btoa(WS_KEY + ":")}`,
      "Content-Type": "application/xml",
      Accept:         "application/xml",
    },
    body: buildProductXML(product),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
  return { success: true, reference: product.reference };
};

/**
 * Import principal — parse, valide, déduplique, puis POST ligne par ligne.
 *
 * @param {File}     file       - Fichier CSV via <input type="file">
 * @param {Function} onProgress - Callback { done, total, result }
 * @returns {{ success: Object[], errors: Object[], skipped: Object[] }}
 */
export const importProductsFromCSV = async (file, onProgress) => {
  // 1. Parser
  const { rows, warnings } = await parseCSVFile(file);
  if (warnings.length) console.warn("Avertissements :", warnings);

  // 2. Vérifier la cohérence des colonnes
  const colCheck = validateColumnCount(rows, EXPECTED_COLUMNS);
  if (!colCheck.valid)
    throw new Error(
      colCheck.badRows
        .map((r) => `Ligne ${r.line} : ${r.actual} colonnes (${r.expected} attendues)`)
        .join("\n") + "\n" + colCheck.suggestion
    );

  // 3. Mapper
  const mapped = rows.map(mapRowToProduct);

  // 4. Déduplication
  const { unique, duplicates } = deduplicateRows(mapped, "reference");
  if (duplicates.length)
    console.warn(`${duplicates.length} doublon(s) ignoré(s)`);

  // 5. Validation métier
  const { valid, report } = validateRows(unique, validateProductRow);
  if (!valid) throw new Error(report);

  // 6. Import séquentiel
  const success = []; const errors = [];

  for (let i = 0; i < unique.length; i++) {
    try {
      const result = await postProduct(unique[i]);
      success.push(result);
      onProgress?.({ done: i + 1, total: unique.length, result: { ...result, ok: true } });
    } catch (err) {
      const result = { success: false, reference: unique[i].reference, error: err.message };
      errors.push(result);
      onProgress?.({ done: i + 1, total: unique.length, result: { ...result, ok: false } });
    }
  }

  return { success, errors, skipped: duplicates };
};
```

---

## 11. Récapitulatif des cas gérés

| Cas problématique | Fonction | Exemple |
|---|---|---|
| Décimale avec virgule | `parseDecimal` | `"12,2"` → `12.2` |
| Espaces dans nombres | `cleanNumber` | `"1 200,50"` → `1200.5` |
| Espace insécable | `cleanNumber` | `"1\u00A0200"` → `1200` |
| Milliers format anglais | `cleanNumber` | `"1,200.50"` → `1200.5` |
| Milliers format européen | `parseDecimal` | `"1.200,50"` → `1200.5` |
| Délimiteur `;` vs `,` | `detectDelimiter` | Auto-détection |
| Conflit décimale/délimiteur | `validateColumnCount` | Erreur explicite |
| Valeurs vides | `cleanString` | `"NULL"` → `null` |
| Valeurs optionnelles vides | `optionalString` | `""` → `undefined` |
| Booléens non standards | `parseBoolean` | `"oui"` → `true` |
| En-têtes mal formatés | `normalizeHeader` | `"ID Parent"` → `"idParent"` |
| Encodage ISO-8859-1 | `detectEncoding` | Accents corrects |
| Lignes incomplètes | `fillMissingFields` | Valeurs par défaut |
| Guillemets incorrects | `parseCSVTolerant` | Avertissement non bloquant |
| Doublons | `deduplicateRows` | Ignorés avec log |
| Colonnes incohérentes | `validateColumnCount` | Message d'erreur clair |