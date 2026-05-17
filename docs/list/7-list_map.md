# Étape 6 — Listes et map() en React

---

## 1. C’est quoi une liste ? (LE "QUOI")

Une **liste** est un ensemble de données :

```javascript
const users = ["Jean", "Marie", "Paul"];
```

---

## 2. Pourquoi utiliser les listes ? (LE "POURQUOI")

Parce que la plupart des apps affichent :

* utilisateurs
* produits
* messages
* tâches

👉 Tu dois afficher des données **dynamiques**

---

## 3. map() — c’est quoi ?

`map()` permet de **transformer un tableau en éléments JSX**

---

## 4. Exemple simple

```jsx
function App() {
  const users = ["Jean", "Marie", "Paul"];

  return (
    <div>
      {users.map(user => (
        <p>{user}</p>
      ))}
    </div>
  );
}
```

---

👉 Pourquoi ?

* `map()` parcourt le tableau
* retourne du JSX pour chaque élément

---

## 5. Problème : clé (key)

❌ Mauvais :

```jsx
<p>{user}</p>
```

---

✅ Correct :

```jsx
<p key={index}>{user}</p>
```

---

👉 Pourquoi ?

* React a besoin d’un identifiant unique
* améliore les performances

---

## 6. Exemple avec objets

```jsx
const users = [
  { id: 1, name: "Jean" },
  { id: 2, name: "Marie" }
];
```

```jsx
{users.map(user => (
  <p key={user.id}>{user.name}</p>
))}
```

---

👉 Pourquoi ?

* utiliser `id` est mieux que `index`

---

## 7. Exemple avec composants

```jsx
function User({ name }) {
  return <p>{name}</p>;
}
```

```jsx
{users.map(user => (
  <User key={user.id} name={user.name} />
))}
```

---

👉 Pourquoi ?

* permet de créer des composants réutilisables

---

## 8. map() + state

```jsx
import { useState } from "react";

function TodoList() {
  const [todos, setTodos] = useState(["Tâche 1"]);

  return (
    <div>
      {todos.map((todo, index) => (
        <p key={index}>{todo}</p>
      ))}
    </div>
  );
}
```

---

👉 Pourquoi ?

* le state contient la liste
* React met à jour automatiquement

---

## 9. Ajouter un élément

```jsx
function addTodo() {
  setTodos([...todos, "Nouvelle tâche"]);
}
```

---

👉 Pourquoi ?

* créer un nouveau tableau
* React détecte le changement

---

## 10. Erreurs courantes

❌ oublier `key`
❌ modifier directement le tableau
❌ ne pas utiliser map()

---

## 11. Résumé

* liste = tableau de données
* `map()` = afficher une liste
* `key` = obligatoire

👉 structure :

```jsx
array.map(item => (
  <Component key={id} />
))
```

---

# Étape suivante

👉 Mini projet

* todo list complète
* liste avec suppression
* CRUD simple

---

🔥 Avec ça, tu peux afficher **n’importe quelle donnée dynamique**
