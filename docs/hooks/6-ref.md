# Étape 7 — Hooks avancés (useRef + autres hooks essentiels)

---

## 1. C’est quoi un Hook ? (Rappel rapide)

Un **hook** est une fonction spéciale React qui permet :

👉 d’utiliser :

* le state
* le cycle de vie
* et d’autres fonctionnalités

dans les composants fonctionnels

---

## 2. useRef — C’est quoi ? (LE "QUOI")

`useRef` permet de créer une **référence persistante**.

```jsx id="u8kq1n"
const ref = useRef(initialValue);
```

👉 Il contient :

```jsx id="9tx7hv"
ref.current
```

---

## 3. Pourquoi utiliser useRef ? (LE "POURQUOI")

`useRef` sert à :

### 1. Accéder au DOM

### 2. Stocker une valeur sans re-render

### 3. garder une valeur entre les renders

---

## 4. Exemple — Accéder à un input

```jsx id="7jybzq"
import { useRef } from "react";

function InputFocus() {
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current.focus();
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
}
```

---

👉 Pourquoi ?

* `ref` est lié au DOM
* `inputRef.current` = input HTML
* `.focus()` fonctionne directement

---

## 5. useRef vs useState

| useState            | useRef                |
| ------------------- | --------------------- |
| déclenche re-render | ne déclenche pas      |
| utilisé pour UI     | utilisé pour stockage |
| dynamique visuel    | interne               |

---

👉 Exemple :

```jsx id="uybcf1"
const count = useRef(0);

count.current++;
```

👉 Pourquoi ?

* valeur mise à jour
* MAIS pas de re-render

---

## 6. Exemple — stocker une valeur

```jsx id="vl7v7g"
import { useRef } from "react";

function Counter() {
  const count = useRef(0);

  function increment() {
    count.current++;
    console.log(count.current);
  }

  return <button onClick={increment}>+</button>;
}
```

---

👉 Pourquoi ?

* garde la valeur entre renders
* sans déclencher React

---

## 7. useMemo — optimisation

### C’est quoi ?

Mémorise un calcul

```jsx id="i2n9mv"
const result = useMemo(() => {
  return calculLourd(data);
}, [data]);
```

---

### Pourquoi ?

* éviter les recalculs inutiles
* améliorer performance

---

## 8. useCallback — fonction optimisée

### C’est quoi ?

Mémorise une fonction

```jsx id="z5h4sy"
const handleClick = useCallback(() => {
  console.log("click");
}, []);
```

---

### Pourquoi ?

* éviter recréation inutile
* utile avec composants enfants

---

## 9. Différence useMemo vs useCallback

| Hook        | Sert à                 |
| ----------- | ---------------------- |
| useMemo     | mémoriser une valeur   |
| useCallback | mémoriser une fonction |

---

## 10. useContext — partager des données

### C’est quoi ?

Permet de partager des données sans props

---

### Exemple

```jsx id="8cf8bq"
import { createContext, useContext } from "react";

const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <p>{theme}</p>;
}
```

---

### Pourquoi ?

* éviter le "prop drilling"
* partager globalement

---

## 11. useReducer — state avancé

### C’est quoi ?

Alternative à useState pour logique complexe

```jsx id="r6b5fh"
const [state, dispatch] = useReducer(reducer, initialState);
```

---

### Exemple

```jsx id="snqk7c"
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    default:
      return state;
  }
}
```

---

### Pourquoi ?

* logique complexe
* plusieurs actions

---

## 12. Résumé

### Hooks essentiels à connaître :

* useState → gérer données
* useEffect → effets
* useRef → référence / stockage
* useMemo → optimiser calcul
* useCallback → optimiser fonction
* useContext → partager données
* useReducer → logique complexe

---

## 13. Quand utiliser quoi ?

👉 simple :

* state simple → useState
* effet → useEffect
* DOM / stockage → useRef
* optimisation → useMemo / useCallback
* global → useContext
* complexe → useReducer

---

# Étape suivante

👉 Mini projet avancé

* todo list avec :

  * ajout
  * suppression
  * filtre
  * optimisation

---

🔥 Là tu entres dans le vrai React pro.

---

Si tu veux, prochaine étape je te fais :

👉 **exercices pratiques (progressifs + corrigés)**
ou
👉 **mini projet complet guidé (très recommandé)**
