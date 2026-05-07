# Guide : Consommer l'API PrestaShop XML dans React

## Sommaire
1. [Comment fonctionne le parsing XML → JSON](#1-comment-fonctionne-le-parsing-xml--json)
2. [La fonction `parseXML` — retourne-t-elle du JSON ?](#2-la-fonction-parsexml--retourne-t-elle-du-json-)
3. [Les mappers par entité](#3-les-mappers-par-entité)
4. [La couche service (fetch + parse)](#4-la-couche-service-fetch--parse)
5. [Custom Hook : `usePrestashop`](#5-custom-hook--useprestashop)
6. [Utilisation dans les composants React](#6-utilisation-dans-les-composants-react)
7. [Architecture complète du projet](#7-architecture-complète-du-projet)
8. [Gérer les erreurs et le loading](#8-gérer-les-erreurs-et-le-loading)
9. [Configuration CORS (Vite)](#9-configuration-cors-vite)

---

## 1. Comment fonctionne le parsing XML → JSON

PrestaShop retourne des données en XML comme ceci :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product xlink:href="https://mon-shop.com/api/products/1">
      <id><![CDATA[1]]></id>
      <name><![CDATA[T-Shirt Bleu]]></name>
      <price><![CDATA[19.99]]></price>
      <description><![CDATA[Un super t-shirt]]></description>
      <quantity><![CDATA[42]]></quantity>
      <active><![CDATA[1]]></active>
    </product>
  </products>
</prestashop>
```

L'objectif est de transformer cela en un **objet JavaScript pur** (JSON) utilisable dans React :

```json
{
  "id": "1",
  "name": "T-Shirt Bleu",
  "price": 19.99,
  "description": "Un super t-shirt",
  "quantity": 42,
  "active": true
}
```

---

## 2. La fonction `parseXML` — retourne-t-elle du JSON ?

> ⚠️ **Réponse courte : Non, pas directement.**

`DOMParser` retourne un **Document XML** (un arbre DOM), pas du JSON. C'est pourquoi on a besoin de **deux étapes** :

```
XML string  →  DOMParser  →  XMLDocument  →  Mapper  →  Objet JS (≈ JSON)
```

Voici comment les deux couches fonctionnent :

### Couche 1 : Parser le XML brut → XMLDocument

```js
// src/services/xml.parser.js

/**
 * Transforme une chaîne XML en Document DOM navigable.
 * @param {string} xmlString - La réponse brute de l'API PrestaShop
 * @returns {Document} - Un XMLDocument (pas encore du JSON !)
 */
export const parseXML = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  // Vérifier les erreurs de parsing
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`Erreur XML : ${parserError.textContent}`);
  }

  return doc; // ← C'est un XMLDocument, pas du JSON
};
```

### Couche 2 : Extraire les données → Objet JS (JSON-ready)

```js
/**
 * Raccourci pour extraire le texte d'un nœud XML.
 * Gère les CDATA et les nœuds absents.
 */
const getText = (parent, selector) =>
  parent.querySelector(selector)?.textContent?.trim() ?? null;

/**
 * Transforme un nœud <product> XML en objet JavaScript pur.
 * @param {Element} productNode - Un nœud XML <product>
 * @returns {Object} - Un objet JS sérialisable en JSON
 */
export const mapProduct = (productNode) => ({
  id: getText(productNode, "id"),
  name: getText(productNode, "name"),
  price: parseFloat(getText(productNode, "price")),       // string → nombre
  description: getText(productNode, "description"),
  quantity: parseInt(getText(productNode, "quantity"), 10), // string → entier
  active: getText(productNode, "active") === "1",         // "1" → booléen
});

/**
 * Parse une réponse XML de liste de produits.
 * @param {string} xmlString - Réponse brute de /api/products
 * @returns {Object[]} - Tableau d'objets produits (JSON-ready)
 */
export const parseProducts = (xmlString) => {
  const doc = parseXML(xmlString);
  const productNodes = doc.querySelectorAll("product");
  return Array.from(productNodes).map(mapProduct);
};
```

### Ce que retourne `parseProducts` — vrai JSON

```js
const result = parseProducts(xmlString);
console.log(result);

// Retourne un tableau d'objets JavaScript pur :
[
  {
    id: "1",
    name: "T-Shirt Bleu",
    price: 19.99,
    description: "Un super t-shirt",
    quantity: 42,
    active: true
  },
  {
    id: "2",
    name: "Jean Slim",
    price: 49.99,
    description: "Jean coupe slim",
    quantity: 15,
    active: true
  }
]

// Tu peux le sérialiser en JSON natif :
JSON.stringify(result); // ✅ Aucun problème
```

---

## 3. Les mappers par entité

Chaque entité PrestaShop a son propre mapper dans `xml.parser.js` :

```js
// src/services/xml.parser.js

// ─── Produits ────────────────────────────────────────────────
export const parseProducts = (xmlString) => {
  const doc = parseXML(xmlString);
  return Array.from(doc.querySelectorAll("product")).map((node) => ({
    id: getText(node, "id"),
    name: getText(node, "name"),
    price: parseFloat(getText(node, "price")),
    quantity: parseInt(getText(node, "quantity"), 10),
    active: getText(node, "active") === "1",
    reference: getText(node, "reference"),
    imageId: getText(node, "id_default_image"),
  }));
};

// ─── Catégories ──────────────────────────────────────────────
export const parseCategories = (xmlString) => {
  const doc = parseXML(xmlString);
  return Array.from(doc.querySelectorAll("category")).map((node) => ({
    id: getText(node, "id"),
    name: getText(node, "name"),
    parentId: getText(node, "id_parent"),
    active: getText(node, "active") === "1",
    description: getText(node, "description"),
  }));
};

// ─── Commandes ───────────────────────────────────────────────
export const parseOrders = (xmlString) => {
  const doc = parseXML(xmlString);
  return Array.from(doc.querySelectorAll("order")).map((node) => ({
    id: getText(node, "id"),
    reference: getText(node, "reference"),
    customerId: getText(node, "id_customer"),
    totalPaid: parseFloat(getText(node, "total_paid")),
    totalShipping: parseFloat(getText(node, "total_shipping")),
    dateAdd: new Date(getText(node, "date_add")), // string → Date
    currentState: getText(node, "current_state"),
  }));
};

// ─── Clients ─────────────────────────────────────────────────
export const parseCustomers = (xmlString) => {
  const doc = parseXML(xmlString);
  return Array.from(doc.querySelectorAll("customer")).map((node) => ({
    id: getText(node, "id"),
    firstName: getText(node, "firstname"),
    lastName: getText(node, "lastname"),
    email: getText(node, "email"),
    active: getText(node, "active") === "1",
    newsletter: getText(node, "newsletter") === "1",
  }));
};
```

---

## 4. La couche service (fetch + parse)

```js
// src/services/prestashop.api.js

import { parseProducts, parseCategories, parseOrders } from "./xml.parser";

const BASE_URL = import.meta.env.VITE_PS_API_URL;   // ex: http://localhost/api
const API_KEY = import.meta.env.VITE_PS_API_KEY;     // clé PrestaShop WebService

/**
 * Fetch générique vers l'API PrestaShop.
 * Retourne la réponse sous forme de string XML.
 */
const fetchXML = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}/${endpoint}`);

  // PrestaShop retourne du JSON par défaut, on force le XML
  url.searchParams.set("output_format", "XML");

  // Paramètres additionnels (pagination, filtres, etc.)
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.set(key, val);
  });

  const response = await fetch(url.toString(), {
    headers: {
      // Authentification PrestaShop : clé API en Basic Auth
      Authorization: `Basic ${btoa(API_KEY + ":")}`,
      Accept: "application/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }

  return response.text(); // ← Retourne le XML brut
};

// ─── Endpoints exposés ────────────────────────────────────────

export const getProducts = async (params = {}) => {
  const xml = await fetchXML("products", {
    display: "full", // récupérer tous les champs
    ...params,
  });
  return parseProducts(xml); // ← Retourne des objets JS
};

export const getCategories = async () => {
  const xml = await fetchXML("categories", { display: "full" });
  return parseCategories(xml);
};

export const getOrders = async (params = {}) => {
  const xml = await fetchXML("orders", { display: "full", ...params });
  return parseOrders(xml);
};

export const getProductById = async (id) => {
  const xml = await fetchXML(`products/${id}`);
  // Un seul produit : on prend le premier (et unique) résultat
  const products = parseProducts(xml);
  return products[0] ?? null;
};
```

---

## 5. Custom Hook : `usePrestashop`

Le hook centralise le fetch, le state de chargement et la gestion d'erreurs :

```js
// src/hooks/usePrestashop.js

import { useState, useEffect, useCallback } from "react";

/**
 * Hook générique pour fetcher des données PrestaShop.astast
 * @param {Function} fetchFn - La fonction service à appeler (ex: getProducts)
 * @param {any[]} deps - Dépendances qui déclenchent un re-fetch
 */
export const usePrestashop = (fetchFn, deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result); // ← Tableau d'objets JS (JSON-ready)
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
};
```

### Hook spécialisé pour les produits (avec filtres)

```js
// src/hooks/useProducts.js

import { useState } from "react";
import { usePrestashop } from "./usePrestashop";
import { getProducts } from "../services/prestashop.api";

export const useProducts = () => {
  const [filters, setFilters] = useState({});

  const { data: products, loading, error, refetch } = usePrestashop(
    () => getProducts(filters),
    [filters] // re-fetch quand les filtres changent
  );

  return { products, loading, error, filters, setFilters, refetch };
};
```

---

## 6. Utilisation dans les composants React

### Exemple 1 : Liste de produits simple

```jsx
// src/components/ProductList.jsx

import { useProducts } from "../hooks/useProducts";

export default function ProductList() {
  const { products, loading, error } = useProducts();

  if (loading) return <p>Chargement des produits...</p>;
  if (error)   return <p style={{ color: "red" }}>Erreur : {error}</p>;
  if (!products.length) return <p>Aucun produit trouvé.</p>;

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <h2>{product.name}</h2>
          <p>Prix : {product.price.toFixed(2)} €</p>
          <p>Stock : {product.quantity} unités</p>
          {!product.active && <span className="badge">Inactif</span>}
        </li>
      ))}
    </ul>
  );
}
```

### Exemple 2 : Fiche produit (par ID)

```jsx
// src/components/ProductDetail.jsx

import { useState, useEffect } from "react";
import { getProductById } from "../services/prestashop.api";

export default function ProductDetail({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductById(productId)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <p>Chargement...</p>;
  if (!product) return <p>Produit introuvable.</p>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <strong>{product.price.toFixed(2)} €</strong>
      <p>Référence : {product.reference}</p>
    </div>
  );
}
```

### Exemple 3 : Produits avec filtre par catégorie

```jsx
// src/components/ProductCatalog.jsx

import { useProducts } from "../hooks/useProducts";
import { usePrestashop } from "../hooks/usePrestashop";
import { getCategories } from "../services/prestashop.api";

export default function ProductCatalog() {
  const { products, loading, setFilters } = useProducts();
  const { data: categories } = usePrestashop(getCategories);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    // Filtre PrestaShop : filter[id_category_default]=[valeur]
    setFilters(
      categoryId ? { "filter[id_category_default]": `[${categoryId}]` } : {}
    );
  };

  return (
    <div>
      <select onChange={handleCategoryChange}>
        <option value="">Toutes les catégories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <div key={p.id} className="card">
              <h3>{p.name}</h3>
              <p>{p.price.toFixed(2)} €</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Architecture complète du projet

```
src/
├── services/
│   ├── prestashop.api.js     # fetch() + gestion auth + endpoints
│   └── xml.parser.js         # DOMParser + mappers par entité
│
├── hooks/
│   ├── usePrestashop.js      # hook générique (loading / error / data)
│   ├── useProducts.js        # hook produits avec filtres
│   └── useOrders.js          # hook commandes
│
├── components/
│   ├── ProductList.jsx        # liste produits
│   ├── ProductDetail.jsx      # fiche produit
│   ├── ProductCatalog.jsx     # catalogue avec filtres
│   └── OrderList.jsx          # liste commandes
│
├── pages/
│   ├── HomePage.jsx
│   ├── CatalogPage.jsx
│   └── OrdersPage.jsx
│
└── .env                       # variables d'environnement (jamais commitées)
```

### Fichier `.env`

```env
VITE_PS_API_URL=http://localhost/api
VITE_PS_API_KEY=MA_CLE_API_PRESTASHOP_ICI
```

> ⚠️ **Ne jamais committer `.env`** — ajouter au `.gitignore`

---

## 8. Gérer les erreurs et le loading

### Pattern recommandé dans un composant

```jsx
const { data, loading, error } = usePrestashop(getProducts);

// 1. Loading en premier
if (loading) return <Spinner />;

// 2. Erreur ensuite
if (error) return <ErrorBanner message={error} />;

// 3. Données vides
if (!data.length) return <EmptyState />;

// 4. Affichage normal
return <ProductGrid products={data} />;
```

### Composants utilitaires

```jsx
// Réutilisables dans toute l'app
const Spinner = () => <div className="spinner">Chargement...</div>;

const ErrorBanner = ({ message }) => (
  <div className="error-banner">
    ❌ {message}
  </div>
);

const EmptyState = ({ text = "Aucun résultat" }) => (
  <p className="empty">{text}</p>
);
```

---

## 9. Configuration CORS (Vite)

En développement, PrestaShop bloque les requêtes cross-origin. Configurer un proxy dans Vite :

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost",       // URL de ton PrestaShop local
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
```

Avec cette config, `fetch("/api/products")` sera automatiquement redirigé vers `http://localhost/api/products` — **pas de problème CORS en dev** !

---

## Résumé du flux de données

```
PrestaShop WebService
        │
        │  HTTP GET (Basic Auth)
        ▼
  Réponse XML brute (string)
        │
        │  parseXML()  → XMLDocument (DOM)
        │  mapper()    → Objet JS (JSON-ready)
        ▼
  Objet / Tableau JavaScript pur
        │
        │  usePrestashop() hook
        │  → { data, loading, error }
        ▼
  Composant React
  → affiche les données proprement typées
```

# 🔌 Guide Complet — Utilisation de `fast-xml-parser` avec PrestaShop (React)

## 📌 Contexte

L’API PrestaShop retourne uniquement du XML (pas de JSON).

👉 Problème : React manipule du JavaScript → il faut convertir proprement le XML  
👉 Solution : utiliser `fast-xml-parser` + des helpers sécurisés

---

## ⚙️ 1. Installation

```bash
npm install fast-xml-parser
```

---

## ⚠️ 2. Les pièges du XML PrestaShop

### ❌ Piège 1 — Attributs XML
```xml
<type notFilterable="true">simple</type>
```

👉 Devient :
```js
{
  type: {
    "@_notFilterable": true,
    "#text": "simple"
  }
}
```

---

### ❌ Piège 2 — Champs multilingues
```xml
<name>
  <language id="1">Produit</language>
</name>
```

---

### ❌ Piège 3 — Tableau ou Objet ?
👉 Si 1 seul élément → objet  
👉 Si plusieurs → tableau  

💥 `.map()` peut planter

---

### ❌ Piège 4 — Balises vides
```xml
<ean13/>
```

---

### ❌ Piège 5 — HTML dans CDATA
```xml
<description><![CDATA[<p>Texte</p>]]></description>
```

---

## 🧠 3. Fichier central : `xml.parser.js`

```javascript
import { XMLParser } from "fast-xml-parser";

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  allowBooleanAttributes: true,
  parseAttributeValue: true,
  trimValues: true,
  processEntities: false,
  ignoreDeclaration: true,
};

export const parseXML = (xmlString) => {
  const parser = new XMLParser(parserOptions);
  return parser.parse(xmlString);
};

export const getValue = (node) => {
  if (node === undefined || node === null) return "";
  if (typeof node === "object") {
    return node["__cdata"] || node["#text"] || node["_"] || "";
  }
  return String(node);
};

export const getTranslatableValue = (node) => {
  if (!node) return "";
  if (node.language) {
    const lang = Array.isArray(node.language)
      ? node.language[0]
      : node.language;
    return getValue(lang);
  }
  return getValue(node);
};

export const toArray = (data) => {
  if (data === undefined || data === null || data === "") return [];
  return Array.isArray(data) ? data : [data];
};
```

---

## 🔄 4. Mapper produit

```javascript
import {
  parseXML,
  getValue,
  getTranslatableValue,
  toArray
} from "./xml.parser";

export const mapProduct = (node) => ({
  id: getValue(node.id),
  reference: getValue(node.reference),
  type: getValue(node.type),
  name: getTranslatableValue(node.name),
  description: getTranslatableValue(node.description_short),
  price: parseFloat(getValue(node.price)) || 0,
  categories: toArray(node.associations?.categories?.category)
    .map(c => getValue(c.id)),
  images: toArray(node.associations?.images?.image)
    .map(img => getValue(img.id)),
});

export const parseProducts = (xmlString) => {
  const result = parseXML(xmlString);
  const rawData = result?.prestashop?.products?.product;
  return toArray(rawData).map(mapProduct);
};
```

---

## ⚛️ 5. Utilisation React

```javascript
useEffect(() => {
  fetch("http://localhost/api/products")
    .then(res => res.text())
    .then(xml => {
      const products = parseProducts(xml);
      setProducts(products);
    });
}, []);
```

---

## 🖼️ 6. HTML dans React

```jsx
<td dangerouslySetInnerHTML={{ __html: product.description }}></td>
```

---

## ✅ Conclusion

✔ Parsing sécurisé  
✔ Compatible PrestaShop  
✔ Aucun crash  
✔ Code réutilisable  

> 💡 **En production** : place un backend Node/Express entre le front React et PrestaShop pour ne jamais exposer ta clé API côté navigateur.