# 📋 Index des fonctions disponibles – Services API & Frontoffice

Voici la liste des principales fonctions que vous pouvez utiliser dans l'application, classées par domaine.  
Chaque entrée indique la signature, une brève description et le fichier source.

---

## 🛒 **Produits**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `getAll()` | `display = "full"` | Récupère tous les produits | `services/product.service.js` |
| `getAllEnriched()` | _aucun_ | Récupère tous les produits avec stock et images | `services/product.service.js` |
| `searchProducts(filters)` | `{ name?, categoryId?, minPrice?, maxPrice? }` | Recherche filtrée de produits | `services/product.service.js` |
| `searchProductsEnriched(filters)` | `{ name?, categoryId?, minPrice?, maxPrice? }` | Recherche enrichie (stock+images) | `services/product.service.js` |
| `findProductByKeyValue(key, value)` | `key: string, value: any` | Cherche un produit par champ (ex: `"id"`, `"reference"`) | `services/product.service.js` |
| `postProduct(product)` | `product: object` | Crée un nouveau produit | `services/product.service.js` |
| `deleteProduct(id)` | `id: number` | Supprime un produit | `services/product.service.js` |
| `resetProducts()` | _aucun_ | Supprime tous les produits | `services/product.service.js` |

---

## 🧩 **Combinaisons / Déclinaisons**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `findCombinationsByProductId(productId)` | `productId: number` | Récupère toutes les combinaisons d'un produit | `services/combination.service.js` |

---

## 📦 **Stock**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `getAll()` | `display = "full"` | Tous les stocks disponibles | `services/stockAvailable.service.js` |
| `getStockAvailableById(id)` | `id: number` | Détail d'un stock par ID | `services/stockAvailable.service.js` |
| `findStockAvailableByProductAttribute(productId, attributeId)` | `productId: number, attributeId: number` | Cherche le stock d'un produit + déclinaison | `services/stockAvailable.service.js` |
| `getStockByProductAndAttribute(productId, attributeId)` | `productId: number, attributeId: number` | Récupère le(s) stock(s) parsé(s) pour un produit/attribut | `services/stockAvailable.service.js` |
| `postStockAvailable(stock)` | `stock: object` | Crée une entrée de stock | `services/stockAvailable.service.js` |
| `updateStockAvailable(stock)` | `stock: object` (avec `id`) | Met à jour une entrée de stock | `services/stockAvailable.service.js` |
| `deleteStockAvailable(id)` | `id: number` | Supprime une entrée de stock | `services/stockAvailable.service.js` |
| `resetStockAvailables()` | _aucun_ | Supprime toutes les entrées de stock | `services/stockAvailable.service.js` |

---

## 🛍️ **Paniers**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `getAll()` | `display = "full"` | Tous les paniers | `services/cart.service.js` |
| `getCartById(cartId)` | `cartId: number` | Détail d'un panier (avec lignes) | `services/cart.service.js` |
| `postCart(cart)` | `cart: object` | Crée un panier | `services/cart.service.js` |
| `putCart(id, cart)` | `id: number, cart: object` | Met à jour un panier | `services/cart.service.js` |
| `deleteCart(id)` | `id: number` | Supprime un panier | `services/cart.service.js` |
| `findCartByKeyValue(key, value)` | `key: string, value: any` | Cherche des paniers par champ | `services/cart.service.js` |
| `getUnorderedCartsByCustomer(customerId)` | `customerId: number` | Paniers non commandés d’un client | `services/cart.service.js` |
| `getUnorderedCarts()` | _aucun_ | Tous les paniers non commandés | `services/cart.service.js` |
| `resetCarts()` | _aucun_ | Supprime tous les paniers | `services/cart.service.js` |

**Frontoffice – Store local :**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `getCart()` | _aucun_ | Lit le panier depuis `localStorage` | `services/frontoffice/cartStore.service.js` |
| `getCartTotals(cart?)` | `cart?: object` | Calcule nombre d’articles et total | `services/frontoffice/cartStore.service.js` |
| `addCartItem(product, quantity)` | `product: object, quantity: number` | Ajoute un article au panier | `services/frontoffice/cartStore.service.js` |
| `updateCartItem(cartKey, quantity)` | `cartKey: string, quantity: number` | Modifie la quantité d’un article | `services/frontoffice/cartStore.service.js` |
| `removeCartItem(cartKey)` | `cartKey: string` | Retire un article du panier | `services/frontoffice/cartStore.service.js` |
| `clearCart()` | _aucun_ | Vide le panier (local et serveur) | `services/frontoffice/cartStore.service.js` |
| `loadCartFromServer(serverCart)` | `serverCart: object` (panier parsé) | Charge un panier complet depuis l’API (enrichit les produits) | `services/frontoffice/cartStore.service.js` |

---

## 📑 **Commandes**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `getAll()` | _aucun_ | Toutes les commandes | `services/order.service.js` |
| `getOrderById(orderId)` | `orderId: number` | Détail d’une commande | `services/order.service.js` |
| `findOrderByKeyValue(key, value)` | `key: string, value: any` | Cherche des commandes par champ | `services/order.service.js` |
| `postOrder(order)` | `order: object` | Crée une commande | `services/order.service.js` |
| `putOrder(orderId, orderPayload)` | `orderId: number, orderPayload: object` | Met à jour une commande (complète) | `services/order.service.js` |
| `updateOrderDate(orderId, dateAdd)` | `orderId: number, dateAdd: string` | Modifie uniquement la date d’une commande | `services/order.service.js` |

---

## 📜 **Historique de commande / États**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `postOrderHistory(entry)` | `{ idOrder, idOrderState, idEmployee?, dateAdd? }` | Ajoute un historique d’état | `services/orderHistory.service.js` |
| `findOrderStateByKeyValue(key, value)` | `key: string, value: any` | Cherche un état de commande (ex: par ID, nom) | `services/orderState.service.js` |

---

## 💰 **Paiements**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `postOrderPayment(payment)` | `{ orderReference, idCurrency, amount, paymentMethod, dateAdd, ... }` | Enregistre un paiement | `services/orderPayment.service.js` |

---

## 👤 **Clients**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `getAll()` | _aucun_ | Tous les clients | `services/customer.service.js` |
| `findCustomerByKeyValue(key, value)` | `key: string, value: any` | Cherche un client par champ (ex: `"email"`) | `services/customer.service.js` |
| `postCustomer(customer)` | `customer: object` | Crée un client | `services/customer.service.js` |
| `deleteCustomer(id)` | `id: number` | Supprime un client | `services/customer.service.js` |

---

## 🏠 **Adresses**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `findAddressByKeyValue(key, value)` | `key: string, value: any` | Cherche une adresse (ex: par `"id_customer"`) | `services/address.service.js` |
| `postAddress(address)` | `address: object` | Crée une adresse | `services/address.service.js` |
| `deleteAddress(id)` | `id: number` | Supprime une adresse | `services/address.service.js` |

---

## 👻 **Invités (Guests)**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `postGuest(guestData)` | `guestData: object` (acceptLanguage, javascript, etc.) | Crée un invité | `services/guest.service.js` |
| `deleteGuest(id)` | `id: number` | Supprime un invité | `services/guest.service.js` |
| `resetGuests()` | _aucun_ | Supprime tous les invités | `services/guest.service.js` |

---

## 🔐 **Sessions (Frontoffice)**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `saveCustomerSession(customer)` | `customer: object` | Sauvegarde la session client | `services/frontoffice/session.service.js` |
| `getCustomerSession()` | _aucun_ | Lit la session client | `services/frontoffice/session.service.js` |
| `clearCustomerSession()` | _aucun_ | Efface la session client | `services/frontoffice/session.service.js` |
| `saveGuestSession(guest)` | `guest: { id, isGuest }` | Sauvegarde la session invité | `services/frontoffice/session.service.js` |
| `getGuestSession()` | _aucun_ | Lit la session invité | `services/frontoffice/session.service.js` |
| `clearGuestSession()` | _aucun_ | Efface la session invité | `services/frontoffice/session.service.js` |
| `isGuestSession()` | _aucun_ | Renvoie `true` si l'utilisateur est un invité | `services/frontoffice/session.service.js` |
| `getActiveSession()` | _aucun_ | Renvoie la session active (client ou invité) | `services/frontoffice/session.service.js` |
| `clearAllSessions()` | _aucun_ | Vide toutes les sessions | `services/frontoffice/session.service.js` |

---

## 💲 **Pricing & Taxes**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `computeCombinationPrice({ basePrice, combinationPriceImpact, taxRate })` | `{ basePrice, combinationPriceImpact, taxRate }` | Calcule prix HT et TTC d'une combinaison | `services/frontoffice/pricing.service.js` |
| `getTaxRateForGroup(idTaxRulesGroup)` | `idTaxRulesGroup: number` | Récupère le taux de taxe d'un groupe | `services/frontoffice/pricing.service.js` |
| `computePriceWithTax(priceExclTax, taxRate)` | `priceExclTax: number, taxRate: number` | Calcule un prix TTC | `services/frontoffice/pricing.service.js` |
| `findTaxRulesByGroupId(groupId)` | `groupId: number` | Récupère les règles de taxe d'un groupe | `services/taxRule.service.js` |
| `findTaxByKeyValue(key, value)` | `key: string, value: any` | Cherche une taxe par champ | `services/tax.service.js` |

---

## 🧾 **Checkout (Frontoffice)**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `checkoutCart({ items, customer })` | `{ items, customer }` | Passe commande pour un client connecté | `services/frontoffice/checkout.service.js` |
| `checkoutGuest({ items, customerForm })` | `{ items, customerForm }` | Passe commande pour un invité (crée le compte) | `services/frontoffice/checkout.service.js` |

---

## 🧰 **Utilitaires généraux**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `parseCSVFile(file)` | `file: File` | Parse un fichier CSV en tableau d'objets | `services/csv.service.js` |
| `API_URL()` | _aucun_ | Retourne l'URL de base de l'API | `config/config.service.js` |
| `WS_KEY()` | _aucun_ | Retourne la clé webservice | `config/config.service.js` |
| `authHeaders()` | _aucun_ | Retourne les headers d'authentification | `config/config.service.js` |
| `validateAllFiles(files)` | `files: { products?, productOptions?, orders? }` | Valide les fichiers CSV d'import | `services/validation.service.js` (probable) |

---

## 🔎 **Recherche par attribut / valeur d'option**

| Fonction | Arguments | Description | Fichier |
|----------|-----------|-------------|---------|
| `findProductOptionValueByKeyValue(key, value)` | `key: string, value: any` | Cherche une valeur d'option de produit | `services/productOptionValue.service.js` |

---

*Les fonctions ci-dessus couvrent la majorité des besoins. Pour les builders XML, référez-vous aux fichiers `buildCartXML`, `buildOrderXML`, etc. dans `XMLUtil/builder/`.*