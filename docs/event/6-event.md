# Étape 5 — Events en React (onClick, onChange)

---

## 1. C’est quoi un Event ? (LE "QUOI")

Un **event** (événement) est une **action utilisateur** sur l’interface.

👉 Exemples :

* clic (click)
* saisie clavier (input)
* changement (change)
* survol (hover)

---

## 2. Pourquoi utiliser les Events ? (LE "POURQUOI")

Parce que ton application doit **réagir aux actions de l’utilisateur**.

👉 Sans events :

* interface passive

👉 Avec events :

* interface interactive

---

## 3. Syntaxe des events en React

```jsx
<button onClick={fonction}>Cliquer</button>
```

👉 Important :

* camelCase (`onClick`, `onChange`)
* on passe une **fonction**, pas un appel direct

---

## 4. onClick (clic)

### Exemple simple

```jsx
function App() {
  function handleClick() {
    alert("Bouton cliqué");
  }

  return <button onClick={handleClick}>Cliquer</button>;
}
```

---

👉 Pourquoi ?

* `onClick` attend une fonction
* React exécute la fonction au clic

---

## 5. Erreur classique

❌ Mauvais :

```jsx
<button onClick={handleClick()}>
```

👉 Pourquoi ?

* la fonction s’exécute immédiatement (au render)

---

✅ Correct :

```jsx
<button onClick={handleClick}>
```

---

## 6. onClick avec paramètres

```jsx
<button onClick={() => handleClick("Jean")}>
  Cliquer
</button>
```

👉 Pourquoi ?

* permet de passer des arguments
* on utilise une fonction fléchée

---

## 7. Exemple avec useState

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

👉 Pourquoi ?

* clic → update state → re-render

---

## 8. onChange (changement input)

### Exemple simple

```jsx
import { useState } from "react";

function Input() {
  const [text, setText] = useState("");

  return (
    <input onChange={(e) => setText(e.target.value)} />
  );
}
```

---

👉 Pourquoi ?

* `e` = événement
* `e.target.value` = valeur du champ

---

## 9. Exemple complet (input + affichage)

```jsx
import { useState } from "react";

function Form() {
  const [name, setName] = useState("");

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <p>{name}</p>
    </div>
  );
}
```

---

👉 Pourquoi ?

* `value` = synchronise avec le state
* React contrôle l’input

👉 ça s’appelle un **controlled component**

---

## 10. Event object (important)

```jsx
function handleChange(e) {
  console.log(e.target.value);
}
```

👉 Pourquoi ?

* `e` contient toutes les infos de l’événement

---

## 11. Résumé

* event = action utilisateur
* `onClick` = clic
* `onChange` = modification input
* toujours passer une fonction

👉 règles :

```text
onClick={fonction}
onChange={(e) => ...}
```

---

# Étape suivante

👉 Listes et map()

Très important pour afficher des données dynamiques
