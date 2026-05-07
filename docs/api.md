# Documentation API PrestaShop Webservice

> **Base URL** : `http://localhost/evaluation/prestashop_edition_classic_version_8.2.6/api`  
> **Clé API** : `4BZZRHIU951PN1SBR6T325HIGV61R1ZP`  
> **Format** : XML par défaut — ajouter `&output_format=JSON` pour du JSON  
> **Auth** : Basic Auth → username = clé API, password = vide

---

## Authentification

### Via URL (navigateur / test rapide)
```
?ws_key=4BZZRHIU951PN1SBR6T325HIGV61R1ZP
```

### Via Header HTTP (Postman / code)
```
Authorization: Basic <base64(CLE:)>
```

Exemple en JS :
```javascript
const WS_KEY = '4BZZRHIU951PN1SBR6T325HIGV61R1ZP';
headers: {
  'Authorization': 'Basic ' + btoa(WS_KEY + ':')
}
```

---

## Format de réponse

| Paramètre URL       | Valeur              | Effet                        |
|---------------------|---------------------|------------------------------|
| `output_format`     | `JSON`              | Réponse en JSON              |
| `output_format`     | `XML` (défaut)      | Réponse en XML               |
| `display`           | `full`              | Tous les champs              |
| `display`           | `[champ1,champ2]`   | Champs spécifiques           |
| `filter[champ]`     | `[valeur]`          | Filtrer par valeur           |
| `sort`              | `[champ_ASC/DESC]`  | Trier                        |
| `limit`             | `10` ou `5,10`      | Limiter / paginer            |

---

## 1. Lister les ressources disponibles

```
GET /api/?ws_key=CLE&output_format=JSON
```

Retourne toutes les ressources accessibles avec leurs URLs.

---

## 2. Clients (`customers`)

### Lister tous les clients
```
GET /api/customers?ws_key=CLE&output_format=JSON
```

### Lister avec tous les champs
```
GET /api/customers?ws_key=CLE&output_format=JSON&display=full
```

### Lister avec champs spécifiques
```
GET /api/customers?ws_key=CLE&output_format=JSON&display=[id,firstname,lastname,email]
```

### Voir un client par ID
```
GET /api/customers/1?ws_key=CLE&output_format=JSON
```

### Filtrer par email
```
GET /api/customers?ws_key=CLE&output_format=JSON&display=full&filter[email]=[test@mail.com]
```

### Créer un client (POST)
```
POST /api/customers?ws_key=CLE
Content-Type: application/xml
```

Body XML :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <customer>
    <firstname>Jean</firstname>
    <lastname>Dupont</lastname>
    <email>jean.dupont@mail.com</email>
    <passwd>motdepasse123</passwd>
    <id_gender>1</id_gender>
    <active>1</active>
  </customer>
</prestashop>
```

> **Astuce** : Faire un GET sur `/api/customers?schema=blank` pour obtenir le squelette XML complet.

### Modifier un client (PUT)
```
PUT /api/customers/1?ws_key=CLE
Content-Type: application/xml
```

Body XML (inclure TOUS les champs obligatoires) :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <customer>
    <id>1</id>
    <firstname>Jean</firstname>
    <lastname>Martin</lastname>
    <email>jean.martin@mail.com</email>
    <passwd>motdepasse123</passwd>
    <active>1</active>
  </customer>
</prestashop>
```

### Supprimer un client (DELETE)
```
DELETE /api/customers/1?ws_key=CLE
```

---

## 3. Commandes (`orders`)

### Lister toutes les commandes
```
GET /api/orders?ws_key=CLE&output_format=JSON&display=full
```

### Voir une commande par ID
```
GET /api/orders/1?ws_key=CLE&output_format=JSON
```

### Filtrer par client
```
GET /api/orders?ws_key=CLE&output_format=JSON&display=full&filter[id_customer]=[1]
```

### Créer une commande (POST)
```
POST /api/orders?ws_key=CLE
Content-Type: application/xml
```

> Récupérer le squelette : `GET /api/orders?schema=blank`

### Modifier une commande (PUT)
```
PUT /api/orders/1?ws_key=CLE
Content-Type: application/xml
```

### Supprimer une commande (DELETE)
```
DELETE /api/orders/1?ws_key=CLE
```

---

## 4. Produits (`products`)

### Lister tous les produits
```
GET /api/products?ws_key=CLE&output_format=JSON&display=full
```

### Voir un produit par ID
```
GET /api/products/1?ws_key=CLE&output_format=JSON
```

### Créer un produit (POST)
```
POST /api/products?ws_key=CLE
Content-Type: application/xml
```

Body XML minimal :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <active>1</active>
    <name>
      <language id="1">Mon Produit</language>
    </name>
    <price>19.99</price>
    <id_tax_rules_group>1</id_tax_rules_group>
    <id_category_default>2</id_category_default>
    <link_rewrite>
      <language id="1">mon-produit</language>
    </link_rewrite>
  </product>
</prestashop>
```

### Modifier un produit (PUT)
```
PUT /api/products/1?ws_key=CLE
Content-Type: application/xml
```

### Supprimer un produit (DELETE)
```
DELETE /api/products/1?ws_key=CLE
```

---

## 5. Autres ressources utiles

| Ressource         | URL                          | Description                  |
|-------------------|------------------------------|------------------------------|
| Adresses          | `/api/addresses`             | Adresses des clients         |
| Catégories        | `/api/categories`            | Catégories de produits       |
| Paniers           | `/api/carts`                 | Paniers en cours             |
| Images produits   | `/api/images/products/{id}`  | Images d'un produit          |
| Stocks            | `/api/stock_availables`      | Disponibilité des stocks     |
| États commandes   | `/api/order_states`          | Statuts de commandes         |
| Transporteurs     | `/api/carriers`              | Modes de livraison           |
| Devises           | `/api/currencies`            | Devises disponibles          |
| Langues           | `/api/languages`             | Langues configurées          |

---

## 6. Astuce — Obtenir le squelette XML avant un POST/PUT

Avant tout appel POST ou PUT, récupérer le schéma XML de la ressource :

```
GET /api/{ressource}?ws_key=CLE&schema=blank     ← squelette vide
GET /api/{ressource}?ws_key=CLE&schema=synopsis  ← avec types et contraintes
```

Exemple :
```
GET /api/customers?ws_key=CLE&schema=blank
```

---

## 7. Pagination

```
GET /api/products?ws_key=CLE&output_format=JSON&display=full&limit=10        ← 10 premiers
GET /api/products?ws_key=CLE&output_format=JSON&display=full&limit=10,10     ← page 2
GET /api/products?ws_key=CLE&output_format=JSON&display=full&limit=20,10     ← page 3
```

Format : `limit=offset,nombre`

---

## 8. Exemple complet en JavaScript (fetch)

```javascript
const WS_KEY = '4BZZRHIU951PN1SBR6T325HIGV61R1ZP';
const BASE = 'http://localhost/evaluation/prestashop_edition_classic_version_8.2.6/api';
const AUTH = 'Basic ' + btoa(WS_KEY + ':');

// GET - Lister les clients
async function getCustomers() {
  const res = await fetch(`${BASE}/customers?output_format=JSON&display=full`, {
    headers: { 'Authorization': AUTH }
  });
  return await res.json();
}

// POST - Créer un client
async function createCustomer() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <customer>
      <firstname>Jean</firstname>
      <lastname>Dupont</lastname>
      <email>jean@mail.com</email>
      <passwd>motdepasse123</passwd>
      <active>1</active>
    </customer>
  </prestashop>`;

  const res = await fetch(`${BASE}/customers`, {
    method: 'POST',
    headers: {
      'Authorization': AUTH,
      'Content-Type': 'application/xml'
    },
    body: xml
  });
  return await res.text();
}

// PUT - Modifier un client
async function updateCustomer(id, xml) {
  const res = await fetch(`${BASE}/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': AUTH,
      'Content-Type': 'application/xml'
    },
    body: xml
  });
  return await res.text();
}

// DELETE - Supprimer un client
async function deleteCustomer(id) {
  const res = await fetch(`${BASE}/customers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': AUTH }
  });
  return res.status; // 200 = succès
}
```

---

## Codes de réponse HTTP

| Code | Signification                              |
|------|--------------------------------------------|
| 200  | Succès (GET, PUT, DELETE)                  |
| 201  | Créé avec succès (POST)                    |
| 400  | Requête invalide (XML mal formé)           |
| 401  | Non autorisé (clé API incorrecte)          |
| 404  | Ressource introuvable                      |
| 500  | Erreur serveur (mod_rewrite / .htaccess)   |