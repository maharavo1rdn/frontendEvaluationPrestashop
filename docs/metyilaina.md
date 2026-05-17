# Utils — Référence fonctions JavaScript
## Projet PrestaShop 8 Webservice

---

## 1. Dates

### Formats rencontrés dans le projet

| Source        | Format               | Exemple                   |
|---------------|----------------------|---------------------------|
| CSV import    | `DD/MM/YYYY`         | `09/05/2026`              |
| PrestaShop DB | `YYYY-MM-DD HH:MM:SS`| `2026-05-09 00:00:00`     |
| PS (date only)| `YYYY-MM-DD`         | `2026-05-09`              |
| Affichage FR  | `DD/MM/YYYY`         | `09/05/2026`              |

---

### 1.1 Parser une date CSV → format PS (`YYYY-MM-DD HH:MM:SS`)

```js
// Entrée  : "09/05/2026"  ou  "09-05-2026"
// Sortie  : "2026-05-09 00:00:00"
const parseDate = (value) => {
  if (!value?.trim()) return undefined;

  // Accepte DD/MM/YYYY et DD-MM-YYYY
  const parts = value.trim().split(/[\/\-]/);
  if (parts.length !== 3) return undefined;

  const [day, month, year] = parts;
  if (!day || !month || !year) return undefined;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} 00:00:00`;
};

// Exemples
parseDate("09/05/2026")  // "2026-05-09 00:00:00"
parseDate("9/5/2026")    // "2026-05-09 00:00:00"  (padStart gère les chiffres seuls)
parseDate("")            // undefined
parseDate(null)          // undefined
```

---

### 1.2 Valider une date (anti-rollover JS)

```js
// Problème : new Date("2026-02-31") est valide en JS (rollover vers mars)
// Solution : vérifier que les composants reconstruits correspondent exactement

const isValidDate = (value) => {
  if (!value?.trim()) return false;
  const parts = value.trim().split(/[\/\-]/);
  if (parts.length !== 3) return false;

  const [day, month, year] = parts;

  // Pour le CSV on exige DD/MM/YYYY strict (2 chiffres / 2 chiffres / 4 chiffres)
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return false;

  const d = new Date(`${year}-${month}-${day}`);
  if (isNaN(d.getTime())) return false;

  // Anti-rollover : 31/02 → JS donne mars, on le rejette
  return (
    d.getUTCFullYear() === Number(year) &&
    d.getUTCMonth() + 1 === Number(month) &&
    d.getUTCDate() === Number(day)
  );
};

// Exemples
isValidDate("31/02/2026")  // false  ← rollover détecté
isValidDate("09/05/2026")  // true
isValidDate("32/01/2026")  // false
isValidDate("00/01/2026")  // false
isValidDate("")            // false
```

---

### 1.3 Parser date PS → affichage français

```js
// Entrée : "2026-05-09 00:00:00"  ou  "2026-05-09"
// Sortie : "09/05/2026"

const formatDateFR = (psDate) => {
  if (!psDate) return "—";
  const dateOnly = psDate.split(" ")[0]; // retire l'heure si présente
  const d = new Date(dateOnly);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Exemples
formatDateFR("2026-05-09 00:00:00")  // "09/05/2026"
formatDateFR("2026-05-09")           // "09/05/2026"
formatDateFR(null)                    // "—"
formatDateFR("")                      // "—"
```

---

### 1.4 Extraire seulement la date (clé pour grouper par jour)

```js
// Utilisé dans stats.service.js et StockEvolution
const getDateKey = (psDate) => psDate ? psDate.split(" ")[0] : "Inconnue";

// Exemples
getDateKey("2026-05-09 14:32:00")  // "2026-05-09"
getDateKey("")                      // "Inconnue"
```

---

### 1.5 Comparer et trier des dates PS

```js
// Trier du plus récent au plus ancien
const items = [
  { dateAdd: "2026-04-01 00:00:00" },
  { dateAdd: "2026-05-09 00:00:00" },
  { dateAdd: "2026-03-15 00:00:00" },
];

const sorted = [...items].sort(
  (a, b) => new Date(b.dateAdd) - new Date(a.dateAdd)
);
// → 09/05, 01/04, 15/03

// Trier des clés de date string directement (sans new Date)
const dateKeys = ["2026-03-15", "2026-05-09", "2026-04-01"];
dateKeys.sort((a, b) => b.localeCompare(a));
// → ["2026-05-09", "2026-04-01", "2026-03-15"]
// localeCompare fonctionne car le format YYYY-MM-DD est lexicographiquement correct
```

---

## 2. Nombres

### 2.1 Parser un nombre depuis une string CSV

```js
// Gère les virgules comme séparateurs décimaux
const parseNumber = (value) => {
  if (value === undefined || value === null) return NaN;
  const cleaned = String(value).trim().replace(",", ".");
  return Number(cleaned);
};

// Exemples
parseNumber("12.50")   // 12.5
parseNumber("12,50")   // 12.5
parseNumber("  42  ")  // 42
parseNumber("")        // NaN
parseNumber("abc")     // NaN
```

---

### 2.2 Parser un nombre optionnel (retourne undefined si vide)

```js
const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }
  return parseNumber(value);
};

// Exemples
parseOptionalNumber("")     // undefined
parseOptionalNumber("0")    // 0
parseOptionalNumber("12.5") // 12.5
```

---

### 2.3 Parser un pourcentage (TVA)

```js
// Entrée : "20%"  ou  "20"  ou  "8.5%"
// Sortie : nombre (20, 20, 8.5)

const parsePercentage = (value) => {
  if (!value) return 0;
  const cleaned = String(value).trim().replace("%", "");
  return parseNumber(cleaned);
};

// Exemples
parsePercentage("20%")   // 20
parsePercentage("8.5%")  // 8.5
parsePercentage("20")    // 20
parsePercentage("")      // 0
```

---

### 2.4 Valider qu'un montant est positif

```js
const isPositiveAmount = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return true; // champ optionnel → valide
  }
  const num = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(num) && num >= 0;
};

// Exemples
isPositiveAmount("")      // true  (optionnel)
isPositiveAmount("12.5")  // true
isPositiveAmount("-5")    // false
isPositiveAmount("abc")   // false
isPositiveAmount(0)       // true
```

---

### 2.5 Arrondir les montants monétaires

```js
// Arrondi bancaire (évite les erreurs flottantes)
const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// Formater pour affichage
const formatPrice = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);

// Pour les champs PS (6 décimales)
const formatDecimal = (value, decimals = 6) => {
  if (!Number.isFinite(value)) return "0.000000";
  return value.toFixed(decimals);
};

// Exemples
roundMoney(12.005)          // 12.01
formatPrice(1234.5)         // "1 234,50 €"
formatDecimal(12.5)         // "12.500000"
formatDecimal(12.5, 2)      // "12.50"
```

---

## 3. Strings

### 3.1 Nettoyer une string CSV

```js
// PapaParse fait déjà trim sur les valeurs, mais si besoin manuellement :
const clean = (value) => String(value ?? "").trim();

// Vérifier qu'une string n'est pas vide après nettoyage
const isEmpty = (value) => !String(value ?? "").trim();

// Exemples
clean("  Rakoto  ")  // "Rakoto"
clean(null)          // ""
isEmpty("")          // true
isEmpty("  ")        // true
isEmpty("Rakoto")    // false
```

---

### 3.2 Parser le champ "nom" → prénom / nom de famille

```js
// Entrée : "Rakoto Andriamanana"
// Sortie : { firstname: "Rakoto", lastname: "Andriamanana" }

const parseName = (nom) => {
  if (!nom?.trim()) return { firstname: "Inconnu", lastname: "-" };
  const parts = nom.trim().split(/\s+/);
  return {
    firstname: parts[0],
    lastname: parts.length > 1 ? parts.slice(1).join(" ") : "-",
  };
};

// Exemples
parseName("Rakoto")               // { firstname: "Rakoto", lastname: "-" }
parseName("Rakoto Andriamanana")  // { firstname: "Rakoto", lastname: "Andriamanana" }
parseName("  ")                   // { firstname: "Inconnu", lastname: "-" }
parseName(null)                   // { firstname: "Inconnu", lastname: "-" }
```

---

### 3.3 Parser la colonne "achat" du CSV commandes

```js
// Format brut : [(\"T_01\";3;\"ngoza\"),(\"C_03\";1;\"\")]
// Sortie : [{ reference: "T_01", quantity: 3, karazany: "ngoza" }, ...]

const parseAchatColumn = (raw) => {
  if (!raw?.trim()) return [];
  const cleaned = raw.trim().slice(1, -1); // retire les crochets extérieurs
  const items = [];
  const tupleRegex = /\("([^"]*)";(\d+);"([^"]*)"\)/g;
  let match;
  while ((match = tupleRegex.exec(cleaned)) !== null) {
    items.push({
      reference: match[1],
      quantity: parseInt(match[2], 10),
      karazany: match[3] || null,
    });
  }
  return items;
};

// Exemple
parseAchatColumn('[(\"T_01\";3;\"ngoza\"),(\"C_03\";1;\"\")]')
// [
//   { reference: "T_01", quantity: 3, karazany: "ngoza" },
//   { reference: "C_03", quantity: 1, karazany: null },
// ]
```

---

### 3.4 Construire une URL de filtre PrestaShop

```js
// PS attend : filter[nom]=[valeur] sans encodage des crochets
const buildFilterQuery = (filters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    params.append(`filter[${key}]`, `[${value}]`);
  }
  params.append("output_format", "XML");
  params.append("display", "full");
  return params.toString().replace(/%5B/g, "[").replace(/%5D/g, "]");
};

// Exemple
buildFilterQuery({ id_customer: 27 })
// "filter[id_customer]=[27]&output_format=XML&display=full"
```

---

## 4. Méthodes Array JS — cas d'usage projet

### 4.1 `map` — transformer un tableau

```js
// Extraire les IDs d'un tableau d'objets
const ids = products.map((p) => p.id);
// ["1", "2", "3"]

// Construire les cart_rows pour le XML
const cartRows = items.map((item) => ({
  idProduct: item.idProduct,
  idProductAttribute: item.idProductAttribute || 0,
  quantity: item.quantity,
}));

// Normaliser des IDs en string pour comparaison fiable
const normalizeIds = (ids) => ids.map((id) => String(id)).sort();
```

---

### 4.2 `filter` — sélectionner des éléments

```js
// Garder seulement les paniers qui n'ont pas de commande associée
const unorderedCarts = carts.filter(
  (cart) => !orderedCartIds.has(String(cart.id))
);

// Garder les images valides (avec un id)
const images = arr.filter((img) => img?.id);

// Retirer les items avec quantité 0
cart.items = cart.items.filter((item) => item.quantity > 0);

// Garder seulement les noms non vides
const names = values.filter(Boolean); // équivalent à filter(v => !!v)
```

---

### 4.3 `find` — trouver un élément

```js
// Trouver une combinaison par ID
const combination = combos.find(
  (c) => String(c.id) === String(item.idProductAttribute)
);

// Trouver la combinaison par défaut
const defaultCombo = combos.find((c) => c.defaultOn) ?? combos[0];

// Trouver une adresse par ville
const address = addresses.find(
  (a) => a.address1?.trim().toLowerCase() === row.adresse?.trim().toLowerCase()
);
```

---

### 4.4 `some` — vérifier si au moins un élément correspond

```js
// Vérifier si une règle de taxe existe déjà pour ce groupe
const hasRule = rules.some(
  (rule) => String(rule.taxId) === String(taxId)
);

// Vérifier si le panier doit être mis à jour avant le checkout
const mustUpdateCart =
  String(serverCart.idCustomer ?? 0) !== String(customer.id) ||
  cartRows.some(
    (row) => String(row.idAddressDelivery ?? 0) !== String(address.id)
  );
```

---

### 4.5 `reduce` — agréger des valeurs

```js
// Calculer le total TTC d'une commande
const totalTtc = resolvedItems.reduce(
  (sum, item) => sum + item.unitPriceTtc * item.quantity,
  0
);

// Calculer la quantité totale du panier
const totalQuantity = cart.items.reduce(
  (sum, item) => sum + Number(item.quantity || 0),
  0
);

// Grouper des commandes par date (pattern utilisé dans stats.service.js)
const dailyStats = orders.reduce((groups, order) => {
  const key = order.dateAdd?.split(" ")[0] ?? "Inconnue";
  if (!groups[key]) groups[key] = { date: key, count: 0, total: 0 };
  groups[key].count += 1;
  groups[key].total += parseFloat(order.totalPaid) || 0;
  return groups;
}, {});
```

---

### 4.6 `sort` — trier

```js
// Trier des commandes du plus récent au plus ancien
orders.sort((a, b) => new Date(b.dateAdd) - new Date(a.dateAdd));

// Trier des clés de date string (YYYY-MM-DD) — plus performant que new Date
dateKeys.sort((a, b) => b.localeCompare(a));

// Trier des IDs numériques
ids.sort((a, b) => Number(a) - Number(b));

// ATTENTION : sort mute le tableau original → utiliser [...arr].sort() pour éviter
const sorted = [...orders].sort((a, b) => new Date(b.dateAdd) - new Date(a.dateAdd));
```

---

### 4.7 `Promise.all` — exécuter des appels async en parallèle

```js
// Charger plusieurs ressources en même temps
const [product, stocks, rate, combos] = await Promise.all([
  getProductById(id),
  findStockAvailablesByProductId(id),
  getTaxRateForGroup(idTaxRulesGroup),
  findCombinationsByProductId(id),
]);

// Enrichir un tableau d'objets en parallèle
const enrichedProducts = await Promise.all(
  products.map(async (product) => {
    const stock = await getStockAvailableById(product.stockId);
    return { ...product, stockQuantity: stock?.quantity ?? null };
  })
);

// Avec gestion d'erreur individuelle (ne bloque pas les autres)
const results = await Promise.all(
  items.map((item) =>
    fetchSomething(item.id).catch(() => null) // null si erreur
  )
);
```

---

### 4.8 `Set` — dédupliquer et tester l'appartenance en O(1)

```js
// Construire un ensemble d'IDs de paniers déjà commandés
const orderedCartIds = new Set(
  orders.map((order) => String(order.idCart))
);

// Tester si un panier est commandé
if (!orderedCartIds.has(String(cart.id))) {
  // panier non commandé
}

// Dédupliquer un tableau
const uniqueIds = [...new Set(ids)];
```

---

## 5. Patterns récurrents dans le projet

### 5.1 Normaliser les IDs pour comparaison fiable

```js
// PS peut retourner des IDs en number ou en string selon l'endpoint
// Toujours convertir en String avant de comparer

const isSameId = (a, b) => String(a) === String(b);

// Pour les combinaisons
const normalizeIds = (ids) => ids.map((id) => String(id)).sort();

// Exemple de comparaison de tableaux d'IDs
const target = normalizeIds(attributeIds);
const existing = normalizeIds(combo.associations.productOptionValues);
const isMatch = target.length === existing.length &&
  target.every((id, i) => id === existing[i]);
```

---

### 5.2 Cache pour éviter les appels répétés

```js
// Pattern utilisé pour la TVA dans plusieurs services
const taxRateCache = new Map();

const getTaxRateByGroupId = async (groupId) => {
  if (!groupId) return 0;
  const key = String(groupId);
  if (taxRateCache.has(key)) return taxRateCache.get(key);

  // ...appel API...
  const rate = Number(taxes[0]?.rate) || 0;
  taxRateCache.set(key, rate);
  return rate;
};
```

---

### 5.3 Optional chaining + nullish coalescing

```js
// Accès sécurisé aux propriétés imbriquées
const stockId = product?.associations?.stockAvailables?.[0]?.id;
const quantity = stock?.quantity ?? null;
const name = product?.name ?? "Inconnu";

// Valeur par défaut sur les champs PS souvent vides
const carrier = serverCart.idCarrier || 2; // attention : 0 est falsy → utiliser ?? si 0 est valide
const carrier2 = serverCart.idCarrier ?? 2; // ne remplace que null/undefined, garde 0
```

---

### 5.4 Destructuring

```js
// Extraire des propriétés d'un objet
const { firstname, lastname } = parseName(row.nom);

// Exclure une propriété (utilisé pour le PUT sans currentState)
const { currentState, ...orderWithoutState } = order;
await putOrder(id, { ...orderWithoutState, currentState: undefined });

// Avec renommage
const { id: productId, name: productName } = product;

// Depuis un tableau
const [day, month, year] = "09/05/2026".split("/");
```

---

*Dernière mise à jour : Mai 2026 — Projet PrestaShop 8 Webservice*