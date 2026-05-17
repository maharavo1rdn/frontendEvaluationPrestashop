# Étape 4 — useEffect (Effets de bord)

---

## 1. C’est quoi useEffect ? (LE "QUOI")

`useEffect` est un **hook React** qui permet d’exécuter du code **après le rendu du composant**.

👉 Exemple de choses à faire avec useEffect :

* appeler une API
* lancer du code au chargement
* écouter un changement de state
* manipuler le DOM

---

## 2. Pourquoi utiliser useEffect ? (LE "POURQUOI")

React sépare :

* **le rendu (UI)**
* **les effets (actions externes)**

👉 Sans useEffect, tu ne peux pas :

* appeler une API proprement
* exécuter du code au bon moment

---

👉 Exemple problème :

```jsx
console.log("Hello");
```

➡️ s’exécute **à chaque render**

---

👉 Avec useEffect :

```jsx
useEffect(() => {
  console.log("Hello");
}, []);
```

➡️ s’exécute **une seule fois**

---

## 3. Syntaxe de base

```jsx
useEffect(() => {
  // code à exécuter
}, [dépendances]);
```

---

## 4. Les 3 cas importants

---

### 4.1 Exécution UNE SEULE FOIS (au montage)

```jsx
useEffect(() => {
  console.log("Chargement du composant");
}, []);
```

👉 Pourquoi ?

* `[]` = aucune dépendance
* donc exécuté **une seule fois**

---

### 4.2 Exécution à chaque changement

```jsx
useEffect(() => {
  console.log("count a changé :", count);
}, [count]);
```

👉 Pourquoi ?

* React surveille `count`
* dès qu’il change → effet exécuté

---

### 4.3 Exécution à chaque render

```jsx
useEffect(() => {
  console.log("render");
});
```

👉 Pourquoi ?

* pas de tableau → React exécute tout le temps

---

## 5. Exemple — API (très important)

```jsx
import { useState, useEffect } from "react";

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then(res => res.json())
      .then(data => setUsers(data));
      
      // Équivalent
      const response = await fetch("https://jsonplaceholder.typicode.com/users");
      const data = await response.json();
      setUsers(data);

  }, []);

  return (
    <div>
      {users.map(user => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
}

export default Users;
```

---

👉 Pourquoi ça marche ?

* useEffect se lance au chargement
* fetch récupère les données
* setUsers met à jour le state
* React re-render avec les données

---

## 6. Pourquoi on met `[]` dans useEffect

Sans `[]` :

```jsx
useEffect(() => {
  fetch(...)
});
```

❌ Problème :

* boucle infinie
* re-render → fetch → setState → re-render → etc

---

✅ Avec `[]` :

```jsx
useEffect(() => {
  fetch(...)
}, []);
```

➡️ exécuté une seule fois

---

## 7. Nettoyage (cleanup)

```jsx
useEffect(() => {
  const interval = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => {
    clearInterval(interval);
  };
}, []);
```

---

👉 Pourquoi ?

* éviter les fuites mémoire
* nettoyer avant destruction du composant

---

## 8. Cycle de vie simplifié

Avec useEffect, tu gères :

| Moment  | Explication        |
| ------- | ------------------ |
| Mount   | composant créé     |
| Update  | state change       |
| Unmount | composant supprimé |

---

Exemple :

```jsx
useEffect(() => {
  console.log("Mount");

  return () => {
    console.log("Unmount");
  };
}, []);
```

---

## 9. Erreurs courantes

❌ Oublier les dépendances

```jsx
useEffect(() => {
  console.log(count);
}, []); // mauvais
```

👉 Pourquoi ?

* `count` change mais useEffect ne voit pas

---

✅ Correct :

```jsx
useEffect(() => {
  console.log(count);
}, [count]);
```

---

## 10. Bonnes pratiques

* toujours réfléchir aux dépendances
* utiliser `[]` pour API
* éviter les boucles infinies
* nettoyer les effets (cleanup)

---

## 11. Résumé

* useEffect = gérer les effets
* s’exécute après le render
* dépend du tableau de dépendances

👉 cas principaux :

```text
[]        → une fois
[count]   → quand count change
aucun     → à chaque render
```

---

# Étape suivante

👉 Mini projet pratique

Tu peux maintenant créer :

* une todo list complète
* une app météo (API)
* un CRUD simple

---

🔥 Avec useState + useEffect, tu peux déjà faire **90% des apps React**.

---

Prochaine étape possible :

👉 gestion avancée :

* composants contrôlés avancés
* lifting state
* organisation du code
* mini projet complet
