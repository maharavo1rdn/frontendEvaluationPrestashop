# Manipulation des tableaux et objets en JavaScript (React)

Ce guide couvre les méthodes les plus utiles pour travailler avec des tableaux et des objets (dictionnaires) dans un projet React. Toutes les opérations doivent respecter l’immuabilité pour ne pas muter les états directement.

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

### 1.2 `filter()` – Garder certains éléments

Retourne un nouveau tableau contenant uniquement les éléments qui satisfont une condition.

Exemple : filtrer les commandes par état.

```js
const paidOrders = orders.filter(order => order.state === "Payée");
```

**Immuable :** aucun élément n’est modifié, seul le nouveau sous-ensemble est créé.

### 1.3 `find()` – Trouver le premier élément correspondant

Retourne le premier élément qui satisfait la condition, ou `undefined` si aucun.

Différence avec `filter` : `find` retourne un objet, pas un tableau.

```js
const order = orders.find(o => o.id === 2); // { id: 2, total: 45.50, ... }
```

Utilisation typique : récupérer une entité par son ID.

### 1.4 `some()` – Vérifier si au moins un élément correspond

Retourne `true` si au moins un élément satisfait la condition.

```js
const hasPending = orders.some(o => o.state === "En attente"); // true
```

Utile pour : afficher un badge "Attention" s’il y a des commandes en attente.

### 1.5 `every()` – Vérifier si tous les éléments correspondent

Retourne `true` si tous les éléments satisfont la condition.

```js
const allPaid = orders.every(o => o.state === "Payée"); // false
```

### 1.6 `sort()` – Trier les éléments

Modifie le tableau sur place (**mutable**). Pour l’immuabilité, on fait une copie d’abord.

```js
// Tri par total croissant (immuable)
const sorted = [...orders].sort((a, b) => a.total - b.total);

// Tri par date décroissante
const byDate = [...orders].sort((a, b) => new Date(b.dateAdd) - new Date(a.dateAdd));
```

> **Attention :** `sort()` modifie le tableau original. Toujours copier avec le spread `[...array]` avant dans React.

### 1.7 `reduce()` – Accumuler des valeurs

Réduit le tableau à une valeur unique : nombre, objet, etc. C’est une méthode très puissante.

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
// { 1: {id:1, total:29.99}, 2: {...} }
```

**Immuable :** retourne une nouvelle valeur sans modifier le tableau original.

### 1.8 `includes()` – Vérifier la présence d’une valeur

Retourne un booléen si une valeur exacte est dans le tableau.

```js
const colors = ['rouge', 'vert', 'bleu'];
colors.includes('vert'); // true
```

Pas pour les tableaux d’objets, sauf si on compare une référence identique. Préférer `some()` pour les objets.

### 1.9 `indexOf()` et `findIndex()` – Trouver l’index

- `indexOf(value)` : index de la valeur primitive.
- `findIndex(callback)` : index du premier élément correspondant à une condition.

```js
const index = orders.findIndex(o => o.id === 2); // 1
```

### 1.10 `flat()` et `flatMap()`

- `flat()` : aplatit un tableau de tableaux.
- `flatMap()` : combine `map` et `flat(1)`.

```js
const productVariants = [
  { name: "T-shirt", sizes: ["S", "M", "L"] },
  { name: "Pantalon", sizes: ["38", "40"] },
];

// Récupérer toutes les tailles disponibles
const allSizes = productVariants.flatMap(p => p.sizes);
// ["S", "M", "L", "38", "40"]
```

### 1.11 Opérations immuables : ajouter, supprimer, modifier un élément

#### Ajouter au début / à la fin

```js
const newList = [...orders, newOrder]; // à la fin
const newList = [newOrder, ...orders]; // au début
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
const inserted = [...orders.slice(0, index), newOrder, ...orders.slice(index)];
```

## 2. Objets / dictionnaires

### 2.1 Accès aux clés, valeurs, entrées

- `Object.keys(obj)` → tableau des clés
- `Object.values(obj)` → tableau des valeurs
- `Object.entries(obj)` → tableau de paires `[clé, valeur]`

```js
const product = { id: 1, name: "T-shirt", price: 19.99 };

const clés = Object.keys(product);      // ["id", "name", "price"]
const valeurs = Object.values(product); // [1, "T-shirt", 19.99]
const entries = Object.entries(product); // [["id",1], ["name","T-shirt"], ["price",19.99]]
```

Utile pour itérer sur un objet :

```js
for (const [key, value] of Object.entries(product)) {
  console.log(`${key}: ${value}`);
}
```

### 2.2 Copie et fusion immuable avec le spread operator

```js
// Copie superficielle
const copy = { ...product };

// Fusion avec d'autres propriétés
const updated = { ...product, price: 24.99, stock: 10 };
// Remplace price et ajoute stock

// Fusionner deux objets
const extended = { ...product, ...supplierInfo };
```

> **Attention :** le spread fait une copie superficielle (*shallow copy*). Pour des objets imbriqués, il faut copier chaque niveau.

### 2.3 Transformer un objet avec `reduce` sur les entrées

```js
const prices = { tshirt: 19.99, pantalon: 39.99 };

const discounted = Object.entries(prices).reduce((acc, [key, value]) => {
  acc[key] = value * 0.9;
  return acc;
}, {});
// { tshirt: 17.99, pantalon: 35.99 }
```

### 2.4 Supprimer une propriété sans muter avec le rest operator

```js
const { password, ...safeData } = user;
// safeData contient tout sauf password
```

## 3. Combinaisons courantes dans un projet e-commerce

### 3.1 Enrichir un tableau de commandes avec le nom de l’état

```js
const enriched = await Promise.all(
  orders.map(async (order) => {
    const states = await findOrderStateByKeyValue("id", order.currentState);
    return { ...order, stateName: states?.[0]?.name || order.currentState };
  })
);
```

### 3.2 Calculer le total d’un panier avec `reduce`

```js
const total = cart.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
```

### 3.3 Filtrer les produits en rupture de stock

```js
const available = products.filter(p => p.stock > 0);
```

### 3.4 Vérifier si un produit est déjà dans une wishlist avec `some`

```js
const isInWishlist = wishlist.some(item => item.productId === product.id);
```

### 3.5 Trier les produits par prix

```js
const sorted = [...products].sort((a, b) => a.price - b.price);
```

### 3.6 Construire un dictionnaire de produits à partir d’un tableau avec `reduce`

```js
const productMap = products.reduce((map, p) => {
  map[p.id] = p;
  return map;
}, {});
// Accès rapide : productMap[3]
```

## 4. Règles d’or pour React

| Opération | Mutable à éviter | Immuable à utiliser |
|---|---|---|
| Ajouter à un tableau | `push`, `unshift` | `[...arr, item]` |
| Supprimer | `splice`, `pop`, `shift` | `filter()` |
| Modifier un élément | `arr[i] = newVal` | `map()` avec condition |
| Modifier une propriété objet | `obj.prop = val` | `{ ...obj, prop: val }` |
| Trier | `sort()` sans copie | `[...arr].sort()` |

### Pourquoi l’immuabilité ?

React détecte les changements par référence. Si vous mutez un tableau ou un objet d’état directement, React peut ne pas re-rendre le composant correctement.

## 5. Méthodes supplémentaires utiles

- `Array.from()` : crée un tableau à partir d’un itérable (`NodeList`, `Set`, etc.).
- `new Set(array)` : permet d’éliminer les doublons, puis de revenir à un tableau avec `[...set]`.
- `Array.isArray(value)` : vérifie si une valeur est un tableau.
- `Object.hasOwn(obj, key)` : vérifie si une propriété existe directement sur l’objet, sans passer par la chaîne de prototypes.

## 6. Pièges à éviter

- `sort()` mute le tableau original → toujours copier avant.
- `find()` retourne `undefined` si rien n’est trouvé → toujours vérifier avant d’accéder à une propriété.
- Pour comparer des objets, ne pas utiliser `includes()` sauf si la référence est exactement la même. Utiliser plutôt `find()` ou `some()` avec un callback.
- `flatMap()` n’est pas supporté par Internet Explorer, mais fonctionne dans les navigateurs modernes.

---

Ce fichier peut servir de référence rapide pendant le développement. Chaque exemple est directement applicable dans le projet React en cours.