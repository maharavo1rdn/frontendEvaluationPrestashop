# Manipulation des tableaux et objets en JavaScript (React)

Ce guide couvre les méthodes les plus utiles pour travailler avec des tableaux et des objets (dictionnaires) dans un projet React. Toutes les opérations doivent respecter l’immuabilité pour ne pas muter les états directement.

Objectif : savoir transformer, filtrer, indexer, trier et copier des données JavaScript sans casser le rendu React.

---

## 1. Tableaux (`Array`)

### 1.1 `map()` – Transformer chaque élément

Crée un nouveau tableau en appliquant une fonction à chaque élément.

Cas classique : extraire une propriété, enrichir des données.

```js
const orders = [
  { id: 1, total: 29.99, state: "Payée" },
  { id: 2, total: 45.50, state: "En attente" },
];

// Récupérer uniquement les IDs
const ids = orders.map(order => order.id); // [1, 2]

// Ajouter une propriété calculée
const enriched = orders.map(order => ({
  ...order,
  tva: order.total * 0.2,
}));
```

**Immuable :** retourne un nouveau tableau, l’original est inchangé.

---

### 1.2 `filter()` – Garder certains éléments

Retourne un nouveau tableau contenant uniquement les éléments qui satisfont une condition.

Exemple : filtrer les commandes par état.

```js
const paidOrders = orders.filter(order => order.state === "Payée");
```

**Immuable :** aucun élément n’est modifié, seul le nouveau sous-ensemble est créé.

---

### 1.3 `find()` – Trouver le premier élément correspondant

Retourne le premier élément qui satisfait la condition, ou `undefined` si aucun.

Différence avec `filter` : `find` retourne un objet, pas un tableau.

```js
const order = orders.find(o => o.id === 2);
// { id: 2, total: 45.50, state: "En attente" }
```

Utilisation typique : récupérer une entité par son ID.

```js
const selectedProduct = products.find(p => p.id === selectedProductId);

if (!selectedProduct) {
  console.warn("Produit introuvable");
}
```

---

### 1.4 `some()` – Vérifier si au moins un élément correspond

Retourne `true` si au moins un élément satisfait la condition.

```js
const hasPending = orders.some(o => o.state === "En attente"); // true
```

Utile pour afficher un badge "Attention" s’il y a des commandes en attente.

---

### 1.5 `every()` – Vérifier si tous les éléments correspondent

Retourne `true` si tous les éléments satisfont la condition.

```js
const allPaid = orders.every(o => o.state === "Payée"); // false
```

Exemple React : désactiver un bouton si tous les produits sont déjà sélectionnés.

```js
const allSelected = products.every(product =>
  selectedIds.includes(product.id)
);
```

---

### 1.6 `sort()` – Trier les éléments

Modifie le tableau sur place (**mutable**). Pour l’immuabilité, on fait une copie d’abord.

```js
// Tri par total croissant (immuable)
const sorted = [...orders].sort((a, b) => a.total - b.total);

// Tri par date décroissante
const byDate = [...orders].sort(
  (a, b) => new Date(b.dateAdd) - new Date(a.dateAdd)
);
```

> **Attention :** `sort()` modifie le tableau original. Toujours copier avec le spread `[...array]` avant dans React.

Pour trier des chaînes :

```js
const names = ["Élodie", "Alice", "Zoé"];

const sortedNames = [...names].sort((a, b) =>
  a.localeCompare(b, "fr")
);
```

---

### 1.7 `reduce()` – Accumuler des valeurs

Réduit le tableau à une valeur unique : nombre, objet, tableau, dictionnaire, etc.

Exemple : calculer le total général de toutes les commandes.

```js
const totalGlobal = orders.reduce((acc, order) => acc + order.total, 0);
```

Transformer un tableau en objet indexé par ID :

```js
const ordersById = orders.reduce((acc, order) => {
  acc[order.id] = order;
  return acc;
}, {});

// {
//   1: { id: 1, total: 29.99 },
//   2: { id: 2, total: 45.50 }
// }
```

Compter des éléments par état :

```js
const countByState = orders.reduce((acc, order) => {
  acc[order.state] = (acc[order.state] || 0) + 1;
  return acc;
}, {});

// { "Payée": 1, "En attente": 1 }
```

**Immuable côté tableau :** `reduce()` ne modifie pas le tableau original.  
**Attention côté accumulateur :** on modifie souvent l’objet `acc`, ce qui est acceptable car il est créé localement dans le `reduce`.

---

### 1.8 `includes()` – Vérifier la présence d’une valeur

Retourne un booléen si une valeur exacte est dans le tableau.

```js
const colors = ["rouge", "vert", "bleu"];

colors.includes("vert"); // true
```

Pour les tableaux d’objets, `includes()` ne convient que si on compare exactement la même référence objet.

```js
const product = { id: 1, name: "T-shirt" };
const list = [product];

list.includes(product); // true
list.includes({ id: 1, name: "T-shirt" }); // false
```

Préférer `some()` pour les objets :

```js
const exists = products.some(p => p.id === 1);
```

---

### 1.9 `indexOf()` et `findIndex()` – Trouver l’index

- `indexOf(value)` : index d’une valeur primitive.
- `findIndex(callback)` : index du premier élément correspondant à une condition.

```js
const colors = ["rouge", "vert", "bleu"];
const colorIndex = colors.indexOf("vert"); // 1

const orderIndex = orders.findIndex(o => o.id === 2); // 1
```

Exemple : remplacer un élément à un index sans muter.

```js
const index = orders.findIndex(o => o.id === 2);

const updatedOrders =
  index === -1
    ? orders
    : [
        ...orders.slice(0, index),
        { ...orders[index], state: "Payée" },
        ...orders.slice(index + 1),
      ];
```

---

### 1.10 `flat()` et `flatMap()`

- `flat()` : aplatit un tableau de tableaux.
- `flatMap()` : combine `map()` et `flat(1)`.

```js
const productVariants = [
  { name: "T-shirt", sizes: ["S", "M", "L"] },
  { name: "Pantalon", sizes: ["38", "40"] },
];

// Récupérer toutes les tailles disponibles
const allSizes = productVariants.flatMap(p => p.sizes);
// ["S", "M", "L", "38", "40"]
```

Autre exemple : récupérer toutes les lignes d’une commande.

```js
const orders = [
  {
    id: 1,
    items: [
      { productId: 10, qty: 2 },
      { productId: 11, qty: 1 },
    ],
  },
  {
    id: 2,
    items: [{ productId: 12, qty: 4 }],
  },
];

const allItems = orders.flatMap(order => order.items);
// [
//   { productId: 10, qty: 2 },
//   { productId: 11, qty: 1 },
//   { productId: 12, qty: 4 }
// ]
```

---

### 1.11 `slice()` – Extraire une partie sans modifier

`slice(start, end)` retourne une copie superficielle d’une partie du tableau.  
`end` est exclu.

```js
const products = ["T-shirt", "Pantalon", "Casquette", "Chaussures"];

const firstTwo = products.slice(0, 2);
// ["T-shirt", "Pantalon"]

const fromIndexTwo = products.slice(2);
// ["Casquette", "Chaussures"]

const lastTwo = products.slice(-2);
// ["Casquette", "Chaussures"]
```

**Immuable :** `slice()` ne modifie pas le tableau original.

Cas très courant : pagination côté front.

```js
const page = 2;
const perPage = 10;

const visibleProducts = products.slice(
  (page - 1) * perPage,
  page * perPage
);
```

Copier un tableau :

```js
const copy = products.slice();
// équivalent simple : const copy = [...products];
```

---

### 1.12 `splice()` – Supprimer/insérer en modifiant le tableau

`splice(start, deleteCount, ...items)` modifie le tableau original.  
À éviter directement sur un state React.

```js
const colors = ["rouge", "vert", "bleu"];

colors.splice(1, 1); // supprime "vert"
console.log(colors); // ["rouge", "bleu"]
```

Version immuable avec `slice()` :

```js
const indexToRemove = 1;

const updated = [
  ...colors.slice(0, indexToRemove),
  ...colors.slice(indexToRemove + 1),
];
```

Insérer sans muter :

```js
const index = 2;
const newProduct = "Bonnet";

const inserted = [
  ...products.slice(0, index),
  newProduct,
  ...products.slice(index),
];
```

Remplacer sans muter :

```js
const index = 1;
const replacement = "Chemise";

const replaced = [
  ...products.slice(0, index),
  replacement,
  ...products.slice(index + 1),
];
```

---

### 1.13 `concat()` – Fusionner des tableaux

Retourne un nouveau tableau.

```js
const oldProducts = ["T-shirt", "Pantalon"];
const newProducts = ["Casquette", "Chaussures"];

const allProducts = oldProducts.concat(newProducts);
// ["T-shirt", "Pantalon", "Casquette", "Chaussures"]
```

Équivalent fréquent avec spread :

```js
const allProducts = [...oldProducts, ...newProducts];
```

---

### 1.14 `at()` – Lire un élément par index, y compris négatif

```js
const products = ["T-shirt", "Pantalon", "Casquette"];

products.at(0);  // "T-shirt"
products.at(-1); // "Casquette"
```

Plus lisible que :

```js
products[products.length - 1];
```

---

### 1.15 `join()` – Transformer un tableau en chaîne

```js
const categories = ["Homme", "Sport", "Promo"];

const label = categories.join(" / ");
// "Homme / Sport / Promo"
```

Très utile pour afficher des tags, des catégories ou des erreurs de validation.

```js
const errors = ["Nom obligatoire", "Prix invalide"];

const message = errors.join(", ");
// "Nom obligatoire, Prix invalide"
```

---

### 1.16 `Array.from()` – Créer un tableau depuis un itérable

```js
const set = new Set(["S", "M", "M", "L"]);

const sizes = Array.from(set);
// ["S", "M", "L"]
```

Créer une liste de nombres :

```js
const pages = Array.from({ length: 5 }, (_, index) => index + 1);
// [1, 2, 3, 4, 5]
```

Cas React : générer des boutons de pagination.

```jsx
{Array.from({ length: totalPages }, (_, index) => (
  <button key={index + 1}>
    {index + 1}
  </button>
))}
```

---

### 1.17 `Set` – Supprimer les doublons

```js
const categories = ["Homme", "Femme", "Homme", "Enfant"];

const uniqueCategories = [...new Set(categories)];
// ["Homme", "Femme", "Enfant"]
```

Avec un tableau d’objets, il faut choisir une propriété :

```js
const products = [
  { id: 1, category: "Homme" },
  { id: 2, category: "Femme" },
  { id: 3, category: "Homme" },
];

const categories = [...new Set(products.map(p => p.category))];
// ["Homme", "Femme"]
```

---

### 1.18 `toSorted()`, `toReversed()`, `toSpliced()` – Alternatives immuables modernes

Ces méthodes retournent un nouveau tableau sans modifier l’original.

```js
const prices = [30, 10, 20];

const sorted = prices.toSorted((a, b) => a - b);
// [10, 20, 30]

const reversed = prices.toReversed();
// [20, 10, 30]

const removed = prices.toSpliced(1, 1);
// [30, 20]

console.log(prices); // [30, 10, 20]
```

> À utiliser si votre environnement les supporte. Sinon, garder les versions classiques : `[...arr].sort()`, `[...arr].reverse()` ou `slice()` + spread.

---

### 1.19 `forEach()` – Exécuter une action, pas transformer

`forEach()` sert aux effets de bord : `console.log`, appel API, modification d’une variable externe, etc.  
Il ne retourne pas un nouveau tableau utile.

```js
orders.forEach(order => {
  console.log(order.id, order.total);
});
```

À éviter pour transformer des données :

```js
// Moins clair
const ids = [];
orders.forEach(order => ids.push(order.id));

// Mieux
const ids = orders.map(order => order.id);
```

---

### 1.20 Opérations immuables : ajouter, supprimer, modifier un élément

#### Ajouter au début / à la fin

```js
const newListEnd = [...orders, newOrder];   // à la fin
const newListStart = [newOrder, ...orders]; // au début
```

#### Supprimer un élément par ID sans muter

```js
const updated = orders.filter(o => o.id !== idToRemove);
```

#### Mettre à jour un élément

```js
const updated = orders.map(o =>
  o.id === idToUpdate ? { ...o, state: "Payée" } : o
);
```

#### Insérer à un index spécifique

```js
const index = 2;

const inserted = [
  ...orders.slice(0, index),
  newOrder,
  ...orders.slice(index),
];
```

---

## 2. Objets / dictionnaires

En JavaScript, un “dictionnaire” est souvent représenté par un objet simple :

```js
const productById = {
  1: { id: 1, name: "T-shirt" },
  2: { id: 2, name: "Pantalon" },
};
```

On peut aussi utiliser `Map`, surtout si les clés ne sont pas uniquement des chaînes ou des nombres.

---

### 2.1 Accès aux clés, valeurs, entrées

- `Object.keys(obj)` → tableau des clés
- `Object.values(obj)` → tableau des valeurs
- `Object.entries(obj)` → tableau de paires `[clé, valeur]`

```js
const product = { id: 1, name: "T-shirt", price: 19.99 };

const keys = Object.keys(product);
// ["id", "name", "price"]

const values = Object.values(product);
// [1, "T-shirt", 19.99]

const entries = Object.entries(product);
// [["id", 1], ["name", "T-shirt"], ["price", 19.99]]
```

Utile pour itérer sur un objet :

```js
for (const [key, value] of Object.entries(product)) {
  console.log(`${key}: ${value}`);
}
```

Dans React, `Object.entries()` permet d’afficher un dictionnaire :

```jsx
const stockBySize = {
  S: 5,
  M: 12,
  L: 0,
};

return (
  <ul>
    {Object.entries(stockBySize).map(([size, stock]) => (
      <li key={size}>
        Taille {size} : {stock}
      </li>
    ))}
  </ul>
);
```

---

### 2.2 `Object.fromEntries()` – Reconstruire un objet depuis des paires

`Object.fromEntries(entries)` fait l’opération inverse de `Object.entries()`.

```js
const entries = [
  ["name", "T-shirt"],
  ["price", 19.99],
  ["stock", 10],
];

const product = Object.fromEntries(entries);
// { name: "T-shirt", price: 19.99, stock: 10 }
```

#### Transformer les valeurs d’un objet

Exemple : appliquer une remise sur tous les prix.

```js
const prices = {
  tshirt: 19.99,
  pantalon: 39.99,
  casquette: 14.99,
};

const discounted = Object.fromEntries(
  Object.entries(prices).map(([key, value]) => [
    key,
    Number((value * 0.9).toFixed(2)),
  ])
);

// {
//   tshirt: 17.99,
//   pantalon: 35.99,
//   casquette: 13.49
// }
```

#### Filtrer les propriétés d’un objet

Exemple : enlever les champs vides avant d’envoyer un formulaire.

```js
const filters = {
  category: "Homme",
  brand: "",
  minPrice: 10,
  maxPrice: null,
};

const cleanedFilters = Object.fromEntries(
  Object.entries(filters).filter(([, value]) =>
    value !== "" && value !== null && value !== undefined
  )
);

// { category: "Homme", minPrice: 10 }
```

#### Transformer un tableau en dictionnaire indexé par ID

```js
const products = [
  { id: 1, name: "T-shirt" },
  { id: 2, name: "Pantalon" },
];

const productsById = Object.fromEntries(
  products.map(product => [product.id, product])
);

// {
//   1: { id: 1, name: "T-shirt" },
//   2: { id: 2, name: "Pantalon" }
// }
```

C’est souvent plus concis que `reduce()` pour construire un dictionnaire.

---

### 2.3 `Object.entries()` + `map()` + `Object.fromEntries()` – Pattern très utile

Ce pattern est très pratique pour transformer un objet tout en gardant ses clés.

```js
const stockBySize = {
  S: 5,
  M: 0,
  L: 2,
};

const labelsBySize = Object.fromEntries(
  Object.entries(stockBySize).map(([size, stock]) => [
    size,
    stock > 0 ? "Disponible" : "Rupture",
  ])
);

// {
//   S: "Disponible",
//   M: "Rupture",
//   L: "Disponible"
// }
```

Résumé mental :

```js
objet
→ Object.entries(objet)
→ map/filter/reduce
→ Object.fromEntries(...)
→ nouvel objet
```

---

### 2.4 Copie et fusion immuable avec le spread operator

```js
const product = { id: 1, name: "T-shirt", price: 19.99 };

// Copie superficielle
const copy = { ...product };

// Fusion avec d'autres propriétés
const updated = { ...product, price: 24.99, stock: 10 };
// Remplace price et ajoute stock

// Fusionner deux objets
const extended = { ...product, ...supplierInfo };
```

> **Attention :** le spread fait une copie superficielle (*shallow copy*). Pour des objets imbriqués, il faut copier chaque niveau.

Exemple avec objet imbriqué :

```js
const user = {
  id: 1,
  name: "Alice",
  address: {
    city: "Paris",
    zipCode: "75000",
  },
};

const updatedUser = {
  ...user,
  address: {
    ...user.address,
    city: "Lyon",
  },
};
```

---

### 2.5 Supprimer une propriété sans muter avec le rest operator

```js
const user = {
  id: 1,
  email: "alice@example.com",
  password: "secret",
};

const { password, ...safeData } = user;

// safeData = {
//   id: 1,
//   email: "alice@example.com"
// }
```

Supprimer une clé dynamique :

```js
const keyToRemove = "password";

const { [keyToRemove]: removedValue, ...cleanUser } = user;
```

---

### 2.6 `Object.hasOwn()` – Vérifier qu’une clé existe directement

```js
const product = {
  id: 1,
  name: "T-shirt",
};

Object.hasOwn(product, "name"); // true
Object.hasOwn(product, "price"); // false
```

Différence importante : `Object.hasOwn()` vérifie uniquement les propriétés propres de l’objet, pas celles héritées via le prototype.

Exemple utile avant d’accéder à un dictionnaire :

```js
const stockBySize = {
  S: 5,
  M: 0,
};

const size = "L";

const stock = Object.hasOwn(stockBySize, size)
  ? stockBySize[size]
  : 0;
```

---

### 2.7 Accès dynamique aux propriétés

Quand le nom de la clé vient d’une variable, on utilise les crochets.

```js
const field = "price";

const product = {
  name: "T-shirt",
  price: 19.99,
};

console.log(product[field]); // 19.99
```

Cas React : formulaire contrôlé générique.

```js
const [form, setForm] = useState({
  name: "",
  price: "",
  stock: "",
});

function handleChange(event) {
  const { name, value } = event.target;

  setForm(prev => ({
    ...prev,
    [name]: value,
  }));
}
```

Avec des inputs :

```jsx
<input name="name" value={form.name} onChange={handleChange} />
<input name="price" value={form.price} onChange={handleChange} />
<input name="stock" value={form.stock} onChange={handleChange} />
```

---

### 2.8 Valeurs par défaut avec `??`

`??` utilise une valeur par défaut seulement si la valeur est `null` ou `undefined`.

```js
const product = {
  name: "T-shirt",
  stock: 0,
};

const stock = product.stock ?? 10;
// 0, car stock existe vraiment
```

Comparaison avec `||` :

```js
const stockWithOr = product.stock || 10;
// 10, car 0 est considéré comme falsy

const stockWithNullish = product.stock ?? 10;
// 0
```

Pour les données e-commerce, `??` est souvent plus sûr que `||`, car `0` est une valeur valide.

---

### 2.9 Optional chaining `?.` – Accéder sans erreur à une propriété imbriquée

```js
const order = {
  customer: {
    address: {
      city: "Paris",
    },
  },
};

const city = order.customer?.address?.city;
// "Paris"

const zipCode = order.customer?.address?.zipCode;
// undefined
```

Avec une valeur par défaut :

```js
const city = order.customer?.address?.city ?? "Ville inconnue";
```

Très utile pour les réponses API où certaines propriétés peuvent manquer.

---

### 2.10 `structuredClone()` – Copier profondément un objet

Le spread `{ ...obj }` copie seulement le premier niveau.  
`structuredClone()` permet de copier profondément un objet compatible.

```js
const original = {
  id: 1,
  variants: [
    { size: "M", stock: 10 },
  ],
};

const copy = structuredClone(original);

copy.variants[0].stock = 0;

console.log(original.variants[0].stock); // 10
console.log(copy.variants[0].stock);     // 0
```

À utiliser pour copier des données simples. Pour des objets avec fonctions, classes, connexions, éléments DOM ou valeurs spéciales non supportées, il faut une stratégie adaptée.

---

### 2.11 `Map` – Un vrai dictionnaire natif

`Map` est utile quand :

- les clés ne sont pas forcément des chaînes ;
- l’ordre d’insertion compte ;
- on veut utiliser `.set()`, `.get()`, `.has()`, `.delete()`.

```js
const stock = new Map();

stock.set("S", 5);
stock.set("M", 12);

stock.get("S"); // 5
stock.has("L"); // false

stock.delete("M");
```

Convertir un `Map` en objet :

```js
const stockObject = Object.fromEntries(stock);
```

Convertir un objet en `Map` :

```js
const stockBySize = {
  S: 5,
  M: 12,
};

const stockMap = new Map(Object.entries(stockBySize));
```

Dans React, pour un état simple, un objet classique est souvent plus pratique. `Map` est utile pour des cas plus avancés.

---

### 2.12 `Object.freeze()` – Empêcher la modification directe

```js
const config = Object.freeze({
  apiUrl: "/prestashop-api",
  currency: "EUR",
});

config.currency = "USD"; // ignoré ou erreur selon le mode strict
```

`Object.freeze()` est surtout utile pour des constantes. Il ne remplace pas l’immuabilité dans `useState`.

---

## 3. Chaînes (`String`) utiles avec `slice()`, `split()`, `trim()`

Les chaînes sont souvent manipulées dans les formulaires, filtres, recherches et imports CSV.

---

### 3.1 `String.prototype.slice()` – Extraire une partie d’une chaîne

```js
const reference = "CMD-2026-0001";

const prefix = reference.slice(0, 3);
// "CMD"

const number = reference.slice(-4);
// "0001"
```

`slice()` ne modifie pas la chaîne originale.

---

### 3.2 `split()` – Découper une chaîne en tableau

```js
const csvLine = "T-shirt;19.99;10";

const [name, price, stock] = csvLine.split(";");

console.log(name);  // "T-shirt"
console.log(price); // "19.99"
console.log(stock); // "10"
```

Découper des tags :

```js
const input = "sport, homme, promo";

const tags = input.split(",").map(tag => tag.trim());
// ["sport", "homme", "promo"]
```

---

### 3.3 `trim()` – Nettoyer les espaces

```js
const email = "  test@example.com  ";

const cleanedEmail = email.trim();
// "test@example.com"
```

Très utile avant validation de formulaire.

---

### 3.4 `startsWith()`, `endsWith()`, `includes()`

```js
const fileName = "produits.csv";

fileName.endsWith(".csv");      // true
fileName.startsWith("produits"); // true
fileName.includes("duit");      // true
```

Exemple validation simple d’import :

```js
function isCsvFile(fileName) {
  return fileName.toLowerCase().endsWith(".csv");
}
```

---

## 4. Combinaisons courantes dans un projet e-commerce

### 4.1 Enrichir un tableau de commandes avec le nom de l’état

```js
const enriched = await Promise.all(
  orders.map(async (order) => {
    const states = await findOrderStateByKeyValue("id", order.currentState);

    return {
      ...order,
      stateName: states?.[0]?.name || order.currentState,
    };
  })
);
```

---

### 4.2 Calculer le total d’un panier avec `reduce()`

```js
const total = cart.items.reduce(
  (sum, item) => sum + item.unitPrice * item.qty,
  0
);
```

Avec arrondi :

```js
const total = Number(
  cart.items
    .reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
    .toFixed(2)
);
```

---

### 4.3 Filtrer les produits en rupture de stock

```js
const available = products.filter(p => p.stock > 0);
```

---

### 4.4 Vérifier si un produit est déjà dans une wishlist avec `some()`

```js
const isInWishlist = wishlist.some(item => item.productId === product.id);
```

---

### 4.5 Trier les produits par prix

```js
const sorted = [...products].sort((a, b) => a.price - b.price);
```

Avec `toSorted()` si supporté :

```js
const sorted = products.toSorted((a, b) => a.price - b.price);
```

---

### 4.6 Construire un dictionnaire de produits à partir d’un tableau

Avec `reduce()` :

```js
const productMap = products.reduce((map, p) => {
  map[p.id] = p;
  return map;
}, {});

// Accès rapide : productMap[3]
```

Avec `Object.fromEntries()` :

```js
const productMap = Object.fromEntries(
  products.map(product => [product.id, product])
);
```

---

### 4.7 Grouper des commandes par état

```js
const ordersByState = orders.reduce((acc, order) => {
  const state = order.state || "Inconnu";

  if (!acc[state]) {
    acc[state] = [];
  }

  acc[state].push(order);

  return acc;
}, {});
```

Résultat :

```js
{
  "Payée": [
    { id: 1, state: "Payée" }
  ],
  "En attente": [
    { id: 2, state: "En attente" }
  ]
}
```

---

### 4.8 Calculer le stock total par catégorie

```js
const stockByCategory = products.reduce((acc, product) => {
  const category = product.category || "Sans catégorie";

  acc[category] = (acc[category] || 0) + product.stock;

  return acc;
}, {});
```

---

### 4.9 Nettoyer un objet avant envoi API

```js
const form = {
  name: "T-shirt",
  price: "19.99",
  stock: "",
  description: undefined,
};

const payload = Object.fromEntries(
  Object.entries(form).filter(([, value]) =>
    value !== "" && value !== undefined && value !== null
  )
);

// { name: "T-shirt", price: "19.99" }
```

---

### 4.10 Convertir des filtres en paramètres d’URL

```js
const filters = {
  category: "Homme",
  minPrice: 10,
  maxPrice: "",
};

const cleanFilters = Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== "")
);

const query = new URLSearchParams(cleanFilters).toString();
// "category=Homme&minPrice=10"
```

---

### 4.11 Lire des paramètres d’URL en objet

```js
const params = new URLSearchParams("?category=Homme&minPrice=10");

const filters = Object.fromEntries(params.entries());
// { category: "Homme", minPrice: "10" }
```

> Attention : les valeurs provenant d’une URL sont des chaînes. Convertir en nombre si nécessaire.

```js
const minPrice = Number(filters.minPrice);
```

---

### 4.12 Mettre à jour un produit imbriqué dans un state React

```js
setProducts(prevProducts =>
  prevProducts.map(product =>
    product.id === productId
      ? {
          ...product,
          variants: product.variants.map(variant =>
            variant.id === variantId
              ? { ...variant, stock: newStock }
              : variant
          ),
        }
      : product
  )
);
```

---

### 4.13 Ajouter un produit au panier ou augmenter sa quantité

```js
function addToCart(product) {
  setCart(prevCart => {
    const exists = prevCart.items.some(item => item.productId === product.id);

    const items = exists
      ? prevCart.items.map(item =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      : [
          ...prevCart.items,
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            qty: 1,
          },
        ];

    return {
      ...prevCart,
      items,
    };
  });
}
```

---

## 5. Règles d’or pour React

| Opération | Mutable à éviter | Immuable à utiliser |
|---|---|---|
| Ajouter à un tableau | `push`, `unshift` | `[...arr, item]` |
| Supprimer un élément | `splice`, `pop`, `shift` | `filter()` ou `slice()` + spread |
| Modifier un élément | `arr[i] = newVal` | `map()` avec condition |
| Trier | `sort()` sans copie | `[...arr].sort()` ou `toSorted()` |
| Inverser | `reverse()` sans copie | `[...arr].reverse()` ou `toReversed()` |
| Supprimer une propriété objet | `delete obj.key` | rest operator `{ key, ...rest }` |
| Modifier une propriété objet | `obj.prop = val` | `{ ...obj, prop: val }` |
| Modifier un objet imbriqué | `obj.a.b = val` | copier chaque niveau |
| Construire un dictionnaire | boucle + mutation externe | `reduce()` ou `Object.fromEntries()` |

### Pourquoi l’immuabilité ?

React détecte les changements par référence. Si vous mutez un tableau ou un objet d’état directement, React peut ne pas re-rendre le composant correctement.

Mauvais exemple :

```js
products.push(newProduct);
setProducts(products); // même référence : problème possible
```

Bon exemple :

```js
setProducts(prev => [...prev, newProduct]);
```

---

## 6. Méthodes supplémentaires utiles

### 6.1 `Array.isArray(value)`

Vérifie si une valeur est un tableau.

```js
Array.isArray([1, 2, 3]); // true
Array.isArray("test");    // false
```

Utile avant de mapper une réponse API :

```js
const safeProducts = Array.isArray(response.products)
  ? response.products
  : [];
```

---

### 6.2 `Number()`, `parseInt()`, `parseFloat()`

Convertir des valeurs de formulaire ou de CSV.

```js
const price = Number("19.99");      // 19.99
const qty = parseInt("10", 10);     // 10
const total = parseFloat("45.50");  // 45.5
```

Validation :

```js
if (Number.isNaN(price)) {
  throw new Error("Prix invalide");
}
```

---

### 6.3 `Boolean()` pour filtrer rapidement

```js
const values = ["T-shirt", "", null, "Pantalon", undefined];

const cleaned = values.filter(Boolean);
// ["T-shirt", "Pantalon"]
```

Attention : cela supprime aussi `0` et `false`.

---

### 6.4 Destructuring tableau et objet

```js
const product = {
  id: 1,
  name: "T-shirt",
  price: 19.99,
};

const { name, price } = product;
```

Renommer une variable :

```js
const { name: productName } = product;
```

Avec tableau :

```js
const [firstProduct, secondProduct] = products;
```

Ignorer une valeur :

```js
const [, second] = products;
```

---

### 6.5 Paramètres par défaut

```js
function formatPrice(price, currency = "€") {
  return `${price.toFixed(2)} ${currency}`;
}

formatPrice(19.99);      // "19.99 €"
formatPrice(19.99, "$"); // "19.99 $"
```

Avec destructuring :

```js
function createProduct({ name, price, stock = 0 }) {
  return {
    name,
    price,
    stock,
  };
}
```

---

## 7. Pièges à éviter

### 7.1 Confondre `slice()` et `splice()`

```js
const arr = ["a", "b", "c"];

arr.slice(1, 2);  // ["b"], ne modifie pas arr
arr.splice(1, 2); // ["b", "c"], modifie arr
```

Règle simple :

- `slice` = copier une tranche ;
- `splice` = modifier le tableau.

---

### 7.2 `sort()` et `reverse()` mutent le tableau original

```js
const numbers = [3, 1, 2];

const sorted = numbers.sort();
// numbers est aussi modifié
```

Préférer :

```js
const sorted = [...numbers].sort((a, b) => a - b);
```

---

### 7.3 `find()` peut retourner `undefined`

```js
const product = products.find(p => p.id === 99);

console.log(product.name); // erreur si product vaut undefined
```

Préférer :

```js
const product = products.find(p => p.id === 99);

if (!product) {
  return null;
}

console.log(product.name);
```

Ou :

```js
const name = product?.name ?? "Produit inconnu";
```

---

### 7.4 Comparer des objets avec `includes()`

```js
const selected = [{ id: 1 }];

selected.includes({ id: 1 }); // false
```

Préférer :

```js
selected.some(item => item.id === 1); // true
```

---

### 7.5 Oublier que les clés d’objet sont souvent des chaînes

```js
const productMap = {
  1: { name: "T-shirt" },
};

console.log(Object.keys(productMap)); // ["1"]
```

Même si on écrit `1`, la clé est généralement stockée comme chaîne dans un objet classique.

---

### 7.6 Copier seulement le premier niveau

```js
const original = {
  user: {
    name: "Alice",
  },
};

const copy = { ...original };

copy.user.name = "Bob";

console.log(original.user.name); // "Bob"
```

Pourquoi ? `copy.user` et `original.user` pointent vers le même objet imbriqué.

Solution :

```js
const copy = {
  ...original,
  user: {
    ...original.user,
  },
};
```

---

### 7.7 Utiliser `map()` sans retourner de valeur

```js
const result = products.map(product => {
  product.name.toUpperCase();
});

console.log(result); // [undefined, undefined, ...]
```

Corriger :

```js
const result = products.map(product => product.name.toUpperCase());
```

Ou :

```js
const result = products.map(product => {
  return product.name.toUpperCase();
});
```

---

## 8. Mini aide-mémoire

| Besoin | Méthode recommandée |
|---|---|
| Transformer chaque élément | `map()` |
| Garder certains éléments | `filter()` |
| Trouver un élément | `find()` |
| Trouver un index | `findIndex()` |
| Vérifier au moins un élément | `some()` |
| Vérifier tous les éléments | `every()` |
| Calculer une somme | `reduce()` |
| Construire un dictionnaire depuis un tableau | `Object.fromEntries(array.map(...))` ou `reduce()` |
| Transformer un objet | `Object.entries()` + `map()` + `Object.fromEntries()` |
| Filtrer les propriétés d’un objet | `Object.entries()` + `filter()` + `Object.fromEntries()` |
| Extraire une partie de tableau | `slice()` |
| Insérer sans muter | `slice()` + spread |
| Supprimer sans muter | `filter()` ou `slice()` + spread |
| Fusionner des tableaux | `concat()` ou spread |
| Supprimer les doublons | `new Set()` |
| Lire le dernier élément | `at(-1)` |
| Nettoyer une chaîne | `trim()` |
| Découper une chaîne | `split()` |
| Reconstruire une chaîne | `join()` |

---

## 9. Exemple complet : filtrer, trier, paginer

```js
const products = [
  { id: 1, name: "T-shirt", category: "Homme", price: 19.99, stock: 10 },
  { id: 2, name: "Robe", category: "Femme", price: 49.99, stock: 0 },
  { id: 3, name: "Casquette", category: "Homme", price: 14.99, stock: 5 },
];

const filters = {
  category: "Homme",
  onlyAvailable: true,
  search: "t",
};

const page = 1;
const perPage = 10;

const visibleProducts = products
  .filter(product =>
    filters.category ? product.category === filters.category : true
  )
  .filter(product =>
    filters.onlyAvailable ? product.stock > 0 : true
  )
  .filter(product =>
    product.name.toLowerCase().includes(filters.search.toLowerCase().trim())
  )
  .sort((a, b) => a.price - b.price)
  .slice((page - 1) * perPage, page * perPage);
```

Version encore plus sûre pour ne jamais muter avec `sort()` :

```js
const visibleProducts = [...products]
  .filter(product =>
    filters.category ? product.category === filters.category : true
  )
  .filter(product =>
    filters.onlyAvailable ? product.stock > 0 : true
  )
  .filter(product =>
    product.name.toLowerCase().includes(filters.search.toLowerCase().trim())
  )
  .sort((a, b) => a.price - b.price)
  .slice((page - 1) * perPage, page * perPage);
```

---

## 10. Conclusion

Ce fichier peut servir de référence rapide pendant le développement. Chaque exemple est directement applicable dans un projet React/e-commerce.

Règle principale : quand une donnée vient d’un `state`, d’un `prop` ou d’une réponse API que vous voulez conserver, évitez de la modifier directement. Créez une nouvelle version avec `map()`, `filter()`, `slice()`, spread, `reduce()` ou `Object.fromEntries()`.