# Guide complet : PapaParse

## Sommaire
1. [Qu'est-ce que PapaParse ?](#1-quest-ce-que-papaparse-)
2. [Installation](#2-installation)
3. [Anatomie d'un CSV](#3-anatomie-dun-csv)
4. [Les deux modes de parsing](#4-les-deux-modes-de-parsing)
5. [Configuration — toutes les options expliquées](#5-configuration--toutes-les-options-expliquées)
6. [L'objet résultat](#6-lobjet-résultat)
7. [Cas d'usage concrets](#7-cas-dusage-concrets)
8. [Lecture de fichier via input type="file"](#8-lecture-de-fichier-via-input-typefile)
9. [Parsing en streaming (gros fichiers)](#9-parsing-en-streaming-gros-fichiers)
10. [Générer du CSV depuis un tableau JS](#10-générer-du-csv-depuis-un-tableau-js)
11. [Erreurs fréquentes et comment les éviter](#11-erreurs-fréquentes-et-comment-les-éviter)
12. [Intégration avec React](#12-intégration-avec-react)

---

## 1. Qu'est-ce que PapaParse ?

PapaParse est la librairie de parsing CSV la plus utilisée en JavaScript. Elle prend en entrée un **fichier CSV, une chaîne de texte ou une URL**, et retourne des **objets JavaScript** directement utilisables.

```
Fichier CSV  →  PapaParse  →  Tableau d'objets JS
```

Pourquoi l'utiliser plutôt que de parser manuellement avec `split(",")` ?

- Un CSV peut contenir des virgules **à l'intérieur de valeurs** entre guillemets → `split(",")` casse tout
- Les sauts de ligne, l'encodage UTF-8, le BOM (Byte Order Mark) sont gérés automatiquement
- Les types (nombres, booléens) peuvent être convertis automatiquement
- Il supporte le streaming pour les fichiers volumineux

---

## 2. Installation

```bash
npm install papaparse
```

```js
import Papa from "papaparse";
```

---

## 3. Anatomie d'un CSV

Avant de comprendre PapaParse, il faut comprendre ce qu'il parse.

### CSV simple

```csv
name,price,active
T-Shirt Bleu,19.99,true
Jean Slim,49.99,false
Veste Cuir,129.99,true
```

- La **première ligne** est optionnellement un en-tête (noms des colonnes)
- Les **valeurs** sont séparées par un délimiteur (`,` par défaut)
- Chaque **ligne** = un enregistrement

### CSV avec cas spéciaux

```csv
name,description,price
"Pull Laine","Chaud, doux et léger",39.99
"Robe ""Soirée""","Avec guillemets dans la valeur",89.99
"Article
multi-ligne","Description sur
plusieurs lignes",59.99
```

**Règles importantes :**
- Une valeur contenant une virgule doit être entourée de `"guillemets"`
- Un guillemet dans une valeur se double : `""` → `"`
- Une valeur peut contenir des sauts de ligne si entre guillemets
- PapaParse gère tout cela automatiquement

---

## 4. Les deux modes de parsing

### Mode synchrone — `Papa.parse(string, config)`

Bloque l'exécution jusqu'à la fin. Utilisé pour les petits CSV en mémoire.

```js
const csv = `name,price\nT-Shirt,19.99\nJean,49.99`;

const result = Papa.parse(csv, { header: true });
console.log(result.data);
// [{ name: "T-Shirt", price: "19.99" }, { name: "Jean", price: "49.99" }]
```

### Mode asynchrone — `Papa.parse(file, { complete: callback })`

Non-bloquant. **Obligatoire pour les fichiers** (File object du navigateur).

```js
Papa.parse(file, {
  header: true,
  complete: (results) => {
    console.log(results.data); // tableau d'objets
  },
  error: (err) => {
    console.error(err.message);
  }
});
```

### Mode Promise (wrapper manuel — le plus pratique)

PapaParse n'expose pas nativement une API Promise, mais on peut l'encapsuler :

```js
const parseCSV = (file, options = {}) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...options,
      complete: (results) => resolve(results),
      error:    (err)     => reject(new Error(err.message)),
    });
  });

// Utilisation avec async/await
const results = await parseCSV(file, { header: true });
console.log(results.data);
```

---

## 5. Configuration — toutes les options expliquées

```js
Papa.parse(input, {

  // ── Délimiteur ────────────────────────────────────────────
  delimiter: ",",
  // Séparateur entre les valeurs. Défaut : auto-détecté.
  // Autres valeurs courantes : ";" (Excel français), "\t" (TSV)

  // ── Fin de ligne ──────────────────────────────────────────
  newline: "",
  // Caractère de fin de ligne. Défaut : auto-détecté (\r\n, \n, \r)

  // ── En-tête ───────────────────────────────────────────────
  header: true,
  // true  → première ligne = noms des colonnes
  //         data = tableau d'objets { colonne: valeur }
  // false → data = tableau de tableaux [ ["val1", "val2"] ]

  // ── Nettoyage des en-têtes ────────────────────────────────
  transformHeader: (header) => header.trim().toLowerCase(),
  // Transforme les noms de colonnes avant utilisation.
  // Utile pour normaliser "  Name " → "name"

  // ── Conversion automatique des types ─────────────────────
  dynamicTyping: true,
  // true  → "19.99" → 19.99 (number), "true" → true (boolean)
  // false → tout reste en string (défaut)
  // ⚠️ Attention : peut convertir des codes comme "007" → 7

  // ── Lignes vides ──────────────────────────────────────────
  skipEmptyLines: true,
  // true          → ignore les lignes entièrement vides
  // "greedy"      → ignore aussi les lignes ne contenant que des espaces
  // false         → conserve les lignes vides (défaut)

  // ── Encodage ──────────────────────────────────────────────
  encoding: "UTF-8",
  // Encodage du fichier. Défaut : UTF-8.
  // Autres : "ISO-8859-1" pour les vieux exports Excel français

  // ── Transformation des valeurs ────────────────────────────
  transform: (value, header) => value.trim(),
  // Appelé sur chaque valeur individuelle après parsing.
  // Reçoit la valeur et le nom de colonne (si header: true).
  // Utile pour nettoyer les espaces, normaliser les valeurs.

  // ── Commentaires ──────────────────────────────────────────
  comments: "#",
  // Les lignes commençant par ce caractère sont ignorées.
  // false = désactivé (défaut)

  // ── Callbacks ─────────────────────────────────────────────
  complete: (results, file) => { },
  // Appelé quand le parsing est terminé.
  // results = { data, errors, meta }

  error: (error, file) => { },
  // Appelé en cas d'erreur fatale.

  step: (row, parser) => { },
  // Appelé pour chaque ligne (mode streaming).
  // Permet de traiter ligne par ligne sans tout charger en mémoire.

  chunk: (results, parser) => { },
  // Appelé par blocs de lignes (pour les très gros fichiers).

  // ── Streaming ─────────────────────────────────────────────
  worker: false,
  // true → parse dans un Web Worker (non-bloquant pour le UI)
  // Utile pour les fichiers > 10 Mo

  // ── Nombre de lignes ──────────────────────────────────────
  preview: 5,
  // Parse seulement les N premières lignes (aperçu).
  // 0 = toutes les lignes (défaut)

  // ── Guillemets ────────────────────────────────────────────
  quoteChar: '"',
  // Caractère utilisé pour délimiter les valeurs avec caractères spéciaux.

  escapeChar: '"',
  // Caractère d'échappement dans les valeurs entre guillemets.
  // "" → guillemet doublé (standard CSV)
});
```

---

## 6. L'objet résultat

`Papa.parse()` retourne toujours un objet avec trois propriétés :

```js
{
  data: [],    // le contenu parsé
  errors: [],  // les erreurs rencontrées (non fatales)
  meta: {}     // métadonnées du fichier
}
```

### `results.data` — avec `header: true`

```js
[
  { name: "T-Shirt Bleu", price: "19.99", active: "true" },
  { name: "Jean Slim",    price: "49.99", active: "false" },
]
```

### `results.data` — avec `header: false`

```js
[
  ["name",         "price",  "active"],   // ← en-tête incluse comme ligne
  ["T-Shirt Bleu", "19.99",  "true"],
  ["Jean Slim",    "49.99",  "false"],
]
```

### `results.errors` — tableau d'erreurs non fatales

```js
[
  {
    type:    "Quotes",    // type d'erreur : Quotes, Delimiter, FieldMismatch
    code:    "InvalidQuotes",
    message: "Guillemets incorrects à la ligne 3",
    row:     2,           // index de ligne (0-based)
  }
]
```

Types d'erreurs possibles :
- `Quotes` — guillemets mal formés
- `Delimiter` — délimiteur inattendu
- `FieldMismatch` — nombre de colonnes différent de l'en-tête

### `results.meta` — métadonnées

```js
{
  delimiter:    ",",       // délimiteur détecté
  linebreak:    "\r\n",    // type de saut de ligne détecté
  aborted:      false,     // true si Papa.abort() a été appelé
  fields:       ["name", "price", "active"],  // noms des colonnes (si header: true)
  truncated:    false,     // true si preview a limité les lignes
}
```

---

## 7. Cas d'usage concrets

### Cas 1 : CSV avec en-tête, valeurs string

```js
const csv = `
name,idParent,active,description
Vêtements,2,true,Tous nos vêtements
Chaussures,2,true,
Accessoires,2,false,Ceintures et sacs
`.trim();

const result = Papa.parse(csv, {
  header:         true,
  skipEmptyLines: true,
  transform:      (v) => v.trim(),
});

console.log(result.data);
// [
//   { name: "Vêtements",   idParent: "2", active: "true",  description: "Tous nos vêtements" },
//   { name: "Chaussures",  idParent: "2", active: "true",  description: "" },
//   { name: "Accessoires", idParent: "2", active: "false", description: "Ceintures et sacs" },
// ]
```

> ⚠️ Sans `dynamicTyping`, tout est string — `"2"` pas `2`, `"true"` pas `true`.
> Il faut convertir manuellement dans le mapper.

---

### Cas 2 : CSV avec `dynamicTyping`

```js
const result = Papa.parse(csv, {
  header:       true,
  dynamicTyping: true,   // ← conversion automatique
});

console.log(result.data);
// [
//   { name: "Vêtements",   idParent: 2, active: true,  description: "Tous nos vêtements" },
//   { name: "Chaussures",  idParent: 2, active: true,  description: null },
//   { name: "Accessoires", idParent: 2, active: false, description: "Ceintures et sacs" },
// ]
```

> Les cases vides deviennent `null`, les nombres sont convertis, les booléens aussi.

---

### Cas 3 : CSV avec séparateur `;` (export Excel français)

```js
const csv = `nom;prix;actif\nT-Shirt;19,99;vrai`;

const result = Papa.parse(csv, {
  header:    true,
  delimiter: ";",     // ← point-virgule
});
```

> Excel en français utilise `;` comme délimiteur car `,` est le séparateur décimal.

---

### Cas 4 : Normaliser les en-têtes

```js
// CSV avec espaces et majuscules dans les en-têtes
const csv = `  Name  ,  ID Parent  , Active\nVêtements,2,true`;

const result = Papa.parse(csv, {
  header:          true,
  transformHeader: (h) => h.trim()            // "  Name  " → "Name"
                            .toLowerCase()    // "Name"     → "name"
                            .replace(/\s+/g, "_"), // "id parent" → "id_parent"
});

console.log(result.meta.fields);
// ["name", "id_parent", "active"]
```

---

### Cas 5 : Aperçu des 3 premières lignes

```js
const result = Papa.parse(file, {
  header:  true,
  preview: 3,          // ← seulement les 3 premières lignes de données
  complete: (r) => console.log(r.data), // 3 objets max
});
```

Utile pour afficher un aperçu avant l'import complet.

---

### Cas 6 : Vérifier les erreurs après parsing

```js
const result = Papa.parse(csv, { header: true });

if (result.errors.length > 0) {
  result.errors.forEach((err) => {
    console.warn(`Ligne ${err.row + 1} — ${err.type} : ${err.message}`);
  });
}

// Les erreurs non fatales n'empêchent pas result.data d'exister
// PapaParse fait de son mieux même en cas d'erreur partielle
```

---

## 8. Lecture de fichier via `input type="file"`

C'est le cas le plus courant en front-end : l'utilisateur sélectionne un fichier.

```js
// Encapsulation Promise — à mettre dans un fichier utilitaire
export const parseCSVFile = (file, options = {}) =>
  new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Aucun fichier fourni"));
    if (!file.name.endsWith(".csv"))
      return reject(new Error("Le fichier doit être un .csv"));

    Papa.parse(file, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: (h) => h.trim(),
      transform:       (v) => v.trim(),
      ...options,           // options supplémentaires si besoin
      complete: (results) => {
        if (results.errors.length > 0) {
          // Erreurs non fatales — on les log mais on continue
          console.warn("Avertissements CSV :", results.errors);
        }
        resolve(results.data);
      },
      error: (err) => reject(new Error(`Erreur de parsing : ${err.message}`)),
    });
  });
```

```jsx
// Dans un composant React
const fileRef = useRef(null);

const handleImport = async () => {
  const file = fileRef.current?.files?.[0];
  if (!file) return;

  try {
    const rows = await parseCSVFile(file);
    console.log(`${rows.length} lignes parsées`, rows);
  } catch (err) {
    console.error(err.message);
  }
};

return (
  <>
    <input ref={fileRef} type="file" accept=".csv" />
    <button onClick={handleImport}>Importer</button>
  </>
);
```

---

## 9. Parsing en streaming (gros fichiers)

Pour les fichiers > 5 Mo, charger tout en mémoire peut bloquer le navigateur.
Le callback `step` traite **ligne par ligne** :

```js
Papa.parse(file, {
  header: true,
  step: (row, parser) => {
    // row.data = une seule ligne { col: val }
    // row.errors = erreurs de cette ligne

    if (row.errors.length > 0) {
      console.warn("Ligne ignorée :", row.errors);
      return; // sauter cette ligne
    }

    processRow(row.data); // traitement immédiat

    // parser.abort() pour arrêter le parsing
    // parser.pause() / parser.resume() pour contrôler le débit
  },
  complete: () => console.log("Streaming terminé"),
});
```

### Streaming avec pause/resume (contrôle du débit)

```js
const queue = [];

Papa.parse(file, {
  header: true,
  step: (row, parser) => {
    queue.push(row.data);

    if (queue.length >= 100) {
      parser.pause();           // stoppe le parsing

      processBatch(queue).then(() => {
        queue.length = 0;       // vide la queue
        parser.resume();        // reprend le parsing
      });
    }
  },
});
```

---

## 10. Générer du CSV depuis un tableau JS

PapaParse fait aussi la **conversion inverse** : JS → CSV via `Papa.unparse()`.

```js
const data = [
  { name: "T-Shirt Bleu", price: 19.99, active: true },
  { name: "Jean Slim",    price: 49.99, active: false },
];

const csv = Papa.unparse(data);
// name,price,active
// T-Shirt Bleu,19.99,true
// Jean Slim,49.99,false
```

### Avec options

```js
const csv = Papa.unparse(data, {
  delimiter: ";",        // séparateur
  header:    true,       // inclure l'en-tête (défaut: true)
  columns:   ["name", "price"],  // seulement ces colonnes, dans cet ordre
  quotes:    true,       // forcer les guillemets sur toutes les valeurs
  newline:   "\r\n",     // Windows-style (pour Excel)
});
```

### Télécharger le CSV généré

```js
const downloadCSV = (data, filename = "export.csv") => {
  const csv  = Papa.unparse(data, { delimiter: ";" });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  // "\uFEFF" = BOM UTF-8 — nécessaire pour que Excel affiche correctement les accents

  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Utilisation
downloadCSV(products, "produits.csv");
```

---

## 11. Erreurs fréquentes et comment les éviter

### ❌ Oublier `skipEmptyLines: true`

```js
// CSV avec ligne vide à la fin (très courant sous Excel)
// name,price
// T-Shirt,19.99
//                 ← ligne vide
```

Sans `skipEmptyLines`, PapaParse génère un objet vide `{}` ou `[""]`.
→ Toujours mettre `skipEmptyLines: true` pour les imports.

---

### ❌ Faire confiance à `dynamicTyping` pour les codes

```js
// CSV avec codes produits
// reference,name
// 007,James Bond
// 042,La Réponse

// Avec dynamicTyping: true → "007" devient 7 → perd le zéro !
```

→ Ne pas utiliser `dynamicTyping` si les valeurs sont des codes ou références.
→ Convertir manuellement dans le mapper.

---

### ❌ Ne pas gérer les valeurs vides

```js
const row = { name: "Vêtements", description: "" };

// ❌ Sans vérification
const category = { description: row.description }; // description: ""

// ✅ Convertir les chaînes vides en undefined/null
const category = { description: row.description || undefined };
```

---

### ❌ Oublier `transform` pour nettoyer les espaces

```js
// CSV avec espaces autour des valeurs (courant sur les exports manuels)
// " Vêtements ", " 2 "

// ❌ Sans transform → name = " Vêtements " avec les espaces
// ✅ Avec transform
Papa.parse(file, {
  transform: (v) => v.trim(), // supprime les espaces avant/après chaque valeur
});
```

---

### ❌ Encodage incorrect sur les exports Excel

```js
// Les vieux exports Excel sont souvent en ISO-8859-1
// Les accents apparaissent comme : VÃªtements au lieu de Vêtements

Papa.parse(file, {
  encoding: "ISO-8859-1",  // ← forcer l'encodage
});
```

---

## 12. Intégration avec React

### Hook complet `useCSVImport`

```js
// src/hooks/useCSVImport.js
import { useRef, useState } from "react";
import Papa from "papaparse";

/**
 * Hook générique pour importer et parser un fichier CSV.
 * @param {Function} onRowsReady - callback appelé avec le tableau de lignes parsées
 */
export const useCSVImport = (onRowsReady) => {
  const fileRef             = useRef(null);
  const [preview, setPreview] = useState([]);   // aperçu des 5 premières lignes
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Aperçu instantané dès la sélection du fichier
  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    Papa.parse(file, {
      header:          true,
      preview:         5,           // seulement 5 lignes pour l'aperçu
      skipEmptyLines:  true,
      transformHeader: (h) => h.trim(),
      transform:       (v) => v.trim(),
      complete: (r) => setPreview(r.data),
      error:    (e) => setError(e.message),
    });
  };

  // Import complet au clic sur le bouton
  const handleImport = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Sélectionnez un fichier CSV.");
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: (h) => h.trim(),
      transform:       (v) => v.trim(),
      complete: (r) => {
        setLoading(false);
        onRowsReady(r.data);
      },
      error: (e) => {
        setLoading(false);
        setError(e.message);
      },
    });
  };

  return { fileRef, preview, error, loading, handleFileChange, handleImport };
};
```

### Utilisation du hook

```jsx
// src/components/CSVImporter.jsx
import { useCSVImport } from "../hooks/useCSVImport";

export default function CSVImporter() {
  const { fileRef, preview, error, loading, handleFileChange, handleImport } =
    useCSVImport((rows) => {
      console.log("Lignes importées :", rows);
      // traiter les lignes ici
    });

  return (
    <div className="space-y-4 p-6">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}   // aperçu instantané
        className="block text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4 file:rounded-md
          file:border-0 file:bg-sky-50 file:text-sky-700
          file:text-sm file:font-semibold hover:file:bg-sky-100"
      />

      {/* Aperçu des premières lignes */}
      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="text-xs w-full">
            <thead className="bg-slate-50">
              <tr>
                {Object.keys(preview[0]).map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-slate-500 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 text-slate-700">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
            Aperçu des 5 premières lignes
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium">❌ {error}</p>
      )}

      <button
        onClick={handleImport}
        disabled={loading}
        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white
          text-sm font-semibold rounded-md disabled:opacity-50"
      >
        {loading ? "Import en cours…" : "Lancer l'import"}
      </button>
    </div>
  );
}
```

---

## Résumé des options indispensables

```js
Papa.parse(file, {
  header:          true,           // lignes → objets JS
  skipEmptyLines:  true,           // ignore les lignes vides
  transformHeader: (h) => h.trim(), // nettoie les noms de colonnes
  transform:       (v) => v.trim(), // nettoie chaque valeur
  // dynamicTyping: true,           // à éviter sauf si tu contrôles le CSV
  complete: (results) => { },
  error:    (err)     => { },
});
```

> 💡 **Règle générale** : utilise `dynamicTyping: false` (défaut) et convertis les types
> manuellement dans ton mapper — tu as le contrôle total et pas de surprises.