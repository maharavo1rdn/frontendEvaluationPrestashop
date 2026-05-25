# Exemples React Router : useParams et useSearchParams

---

# 1. useParams

`useParams()` permet de récupérer les paramètres dynamiques présents dans le chemin de l'URL.

---

## Exemple simple

### Route

```jsx
<Route path="/users/:id" element={<UserPage />} />
```

---

### URL

```txt
/users/15
```

---

### Composant

```jsx
import { useParams } from "react-router-dom";

function UserPage() {
  const params = useParams();

  console.log(params);

  return <div>User page</div>;
}
```

---

### Résultat

```js
{
  id: "15"
}
```

---

# 2. Extraction directe

Très utilisé en pratique.

```jsx
import { useParams } from "react-router-dom";

function UserPage() {
  const { id } = useParams();

  console.log(id);

  return <div>User ID : {id}</div>;
}
```

---

# 3. Plusieurs paramètres

### Route

```jsx
<Route
  path="/users/:userId/orders/:orderId"
  element={<OrderPage />}
/>
```

---

### URL

```txt
/users/10/orders/500
```

---

### Composant

```jsx
import { useParams } from "react-router-dom";

function OrderPage() {
  const { userId, orderId } = useParams();

  console.log(userId);
  console.log(orderId);

  return (
    <div>
      User : {userId} | Order : {orderId}
    </div>
  );
}
```

---

### Résultat

```txt
10
500
```

---

# 4. useSearchParams

`useSearchParams()` permet de lire les paramètres présents après le `?` dans l'URL.

---

## Exemple simple

### URL

```txt
/products?page=2&sort=price
```

---

### Composant

```jsx
import { useSearchParams } from "react-router-dom";

function ProductsPage() {
  const [searchParams] = useSearchParams();

  const page = searchParams.get("page");
  const sort = searchParams.get("sort");

  console.log(page);
  console.log(sort);

  return <div>Products</div>;
}
```

---

### Résultat

```txt
2
price
```

---

# 5. Ajouter ou modifier des search params

```jsx
import { useSearchParams } from "react-router-dom";

function ProductsPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const changePage = () => {
    setSearchParams({
      page: 3,
      sort: "name",
    });
  };

  return (
    <button onClick={changePage}>
      Change params
    </button>
  );
}
```

---

### Nouvelle URL

```txt
?page=3&sort=name
```

---

# 6. Exemple combiné

## Route

```jsx
<Route path="/users/:id" element={<UserPage />} />
```

---

## URL

```txt
/users/15?page=2&filter=active
```

---

## Composant

```jsx
import {
  useParams,
  useSearchParams,
} from "react-router-dom";

function UserPage() {
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const page = searchParams.get("page");
  const filter = searchParams.get("filter");

  console.log(id);
  console.log(page);
  console.log(filter);

  return (
    <div>
      User : {id}
      <br />
      Page : {page}
      <br />
      Filter : {filter}
    </div>
  );
}
```

---

### Résultat

```txt
15
2
active
```

---

# 7. Cas d'utilisation réels

## useParams

Très utilisé pour :

```txt
/products/5
/users/10
/orders/500
```

Identifier une ressource.

---

## useSearchParams

Très utilisé pour :

* pagination
* recherche
* filtres
* tri

Exemple :

```txt
/products?page=2&category=pc&sort=price
```

---

# 8. Différence importante

## useParams

Lit les valeurs dans le chemin.

```txt
/users/:id
```

---

## useSearchParams

Lit les valeurs après `?`

```txt
/users?page=2
```

---

# 9. Important à comprendre

## useParams retourne un objet

```js
{
  id: "15"
}
```

---

## useSearchParams retourne :

```js
[
  URLSearchParams,
  setSearchParams
]
```

Donc généralement :

```jsx
const [searchParams, setSearchParams] =
  useSearchParams();
```

---

# 10. Récupérer tous les search params

## URL

```txt
/products?page=2&sort=name&category=pc
```

---

## Code

```jsx
import { useSearchParams } from "react-router-dom";

function Page() {
  const [searchParams] = useSearchParams();

  for (const [key, value] of searchParams.entries()) {
    console.log(key, value);
  }

  return <div>Page</div>;
}
```

---

## Résultat

```txt
page 2
sort name
category pc
```
