# Étape 3 — State et Hook useState

## 1. C’est quoi le State ?

Le **state** est une **donnée interne à un composant qui peut changer dans le temps**.

👉 Contrairement aux **props** :

* props = données **externes** (du parent)
* state = données **internes** (du composant)

👉 Concrètement :
Le state est une **mémoire locale** que React surveille pour mettre à jour l’interface.

---

## 2. Pourquoi utiliser le State ?

Parce que tu veux des interfaces **dynamiques** :

Exemples concrets :

* bouton "like"
* compteur
* formulaire
* afficher / cacher un élément
* todo list

👉 Sans state = interface figée
👉 Avec state = interface interactive

👉 Pourquoi ça marche ?
React fonctionne comme ça :

```text
UI = f(state)
```

➡️ Quand le state change → React recalcule l’affichage

---

## 3. useState : le hook principal

```jsx
const [valeur, setValeur] = useState(valeurInitiale);
```

* `valeur` → donnée actuelle
* `setValeur` → fonction pour modifier
* `useState()` → hook React

👉 Pourquoi on utilise ça ?

React **ne détecte pas les variables normales** :

❌ Ceci ne fonctionne pas :

```jsx
let count = 0;
count++;
```

➡️ React ne voit rien → pas de mise à jour

✅ useState :

```jsx
setCount(count + 1);
```

➡️ React détecte → re-render

---

## 4. Exemple simple — Compteur

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Compteur : {count}</h2>

      <button onClick={() => setCount(count + 1)}>
        +
      </button>

      <button onClick={() => setCount(count - 1)}>
        -
      </button>
    </div>
  );
}

export default Counter;
```

👉 Pourquoi ça marche ?

* `useState(0)` initialise la valeur
* `setCount()` informe React
* React **re-render automatiquement le composant**
* `{count}` est mis à jour à l’écran

---

## 5. Modifier le state correctement

❌ Mauvais :

```jsx
count = count + 1
```

👉 Pourquoi c’est faux ?

* React ne détecte pas le changement

---

✅ Bon :

```jsx
setCount(count + 1)
```

👉 Pourquoi ?

* React intercepte
* déclenche un re-render

👉 Toujours utiliser la fonction `set...`

---

## 6. State basé sur l’ancien state

Quand la nouvelle valeur dépend de l’ancienne :

```jsx
setCount(prev => prev + 1);
```

👉 Pourquoi ?

* React met à jour le state de façon **asynchrone**
* évite les bugs si plusieurs updates

---

## 7. Exemple — Toggle (afficher / cacher)

```jsx
import { useState } from "react";

function Toggle() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible)}>
        Toggle
      </button>

      {isVisible && <p>Texte visible</p>}
    </div>
  );
}

export default Toggle;
```

👉 Pourquoi ça marche ?

* `!isVisible` inverse la valeur
* React re-render
* `&&` permet un affichage conditionnel

---

## 8. Exemple — Formulaire simple

```jsx
import { useState } from "react";

function Form() {
  const [name, setName] = useState("");

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Votre nom"
      />

      <p>Bonjour {name}</p>
    </div>
  );
}

export default Form;
```

👉 Ici :

* `value` = state
* `onChange` met à jour

👉 Pourquoi ?

➡️ Le state devient la **source de vérité**
➡️ L’input est contrôlé par React (**controlled component**)

---

## 9. State avec objet

```jsx
import { useState } from "react";

function User() {
  const [user, setUser] = useState({
    name: "",
    age: 0
  });

  function updateName(e) {
    setUser({
      ...user,
      name: e.target.value
    });
  }

  return (
    <div>
      <input onChange={updateName} placeholder="Nom" />
      <p>{user.name}</p>
    </div>
  );
}

export default User;
```

👉 `...user` = on garde les anciennes valeurs

👉 Pourquoi ?

* React **ne fusionne pas automatiquement**
* tu dois recréer l’objet complet

---

## 10. State avec liste

```jsx
import { useState } from "react";

function TodoList() {
  const [todos, setTodos] = useState([]);

  function addTodo() {
    setTodos([...todos, "Nouvelle tâche"]);
  }

  return (
    <div>
      <button onClick={addTodo}>Ajouter</button>

      {todos.map((todo, index) => (
        <p key={index}>{todo}</p>
      ))}
    </div>
  );
}

export default TodoList;
```

👉 On ne modifie jamais directement le tableau
👉 On crée un **nouveau tableau**

👉 Pourquoi ?

* React compare les références mémoire
* nouveau tableau = changement détecté

---

## 11. Lien avec les Props

👉 Très important :

* Parent → passe une fonction (props)
* Enfant → appelle la fonction
* Parent → met à jour son state

Exemple :

```jsx
function App() {
  const [count, setCount] = useState(0);

  return <Button increment={() => setCount(count + 1)} />;
}
```

```jsx
function Button({ increment }) {
  return <button onClick={increment}>+</button>;
}
```

👉 Pourquoi ?

➡️ React impose un flux **unidirectionnel (top → down)**
➡️ le state reste centralisé

---

## 12. Règles importantes

* toujours utiliser `setState`
* ne jamais modifier directement :

  * objets
  * tableaux
* chaque changement → re-render
* useState est **asynchrone**

---

4. 🔥 Les Conditions en React (TRÈS IMPORTANT)

👉 React permet d’afficher ou styliser selon une condition.

5. Condition simple (if)
```jsx
function Message({ isLogged }) {

  if (isLogged) {
    return <h1>Bienvenue</h1>;
  }

  return <h1>Veuillez vous connecter</h1>;
}
```

1. Condition avec opérateur ternaire
```jsx
function Status({ isOnline }) {
  return (
    <p>
      {isOnline ? "En ligne" : "Hors ligne"}
    </p>
  );
}
```

👉 Syntaxe :

**condition ? vrai : faux**
```jsx

1. Condition avec && (affichage simple)
function Notification({ hasMessage }) {
  return (
    <div>
      {hasMessage && <p>Nouveau message</p>}
    </div>
  );
}
```

👉 Si hasMessage = false → rien ne s’affiche

1. 🔥 Style conditionnel (TRÈS UTILISÉ)
Cas 1 : classe dynamique (Tailwind)
```jsx
function Button({ isActive }) {

  return (
    <button
      className={
        isActive
          ? "bg-green-500 text-white px-4 py-2"
          : "bg-gray-300 px-4 py-2"
      }
    >
      Bouton
    </button>
  );
}
```

👉 Ici :

si actif → vert
sinon → gris
Cas 2 : UNE seule condition (style appliqué sinon rien)
```jsx
function Text({ isError }) {

  return (
    <p
      className={
        isError && "text-red-500 font-bold"
      }
    >
      Message
    </p>
  );
}
```

👉 Si isError = false → aucun style ajouté

Cas 3 : plusieurs classes conditionnelles
```jsx
function Card({ isActive }) {

  return (
    <div
      className={`
        p-4 border
        ${isActive ? "bg-blue-100" : ""}
      `}
    >
      Carte
    </div>
  );
}
```
1. 🔥 Condition sur attribut (disabled, hidden, etc.)
```jsx
function SubmitButton({ isLoading }) {

  return (
    <button
      disabled={isLoading}
      className="bg-blue-500 text-white px-4 py-2"
    >
      {isLoading ? "Chargement..." : "Envoyer"}
    </button>
  );
}
```
10. Condition dans une liste
```jsx
function Users({ users }) {

  return (
    <div>

      {users.length === 0 && (
        <p>Aucun utilisateur</p>
      )}

      {users.map(user => (
        <p key={user.id}>
          {user.name}
        </p>
      ))}

    </div>
  );
}

```

1.  Filtrer avec condition
```jsx
function ActiveUsers({ users }) {

  return (
    <div>

      {users
        .filter(user => user.isActive)
        .map(user => (
          <p key={user.id}>
            {user.name}
          </p>
        ))}

    </div>
  );
}
```
12. Condition sans useState (IMPORTANT)

👉 Tu n’es PAS obligé d’utiliser useState.

Tu peux utiliser :

props
variables
données API

Exemple :
```jsx
function Role({ role }) {

  return (
    <p>
      {role === "ADMIN"
        ? "Accès complet"
        : "Accès limité"}
    </p>
  );
}
```

13. Condition sur input (formulaire)

```jsx
function Input({ error }) {

  return (
    <input
      className={
        error
          ? "border-red-500 border p-2"
          : "border p-2"
      }
      placeholder="Nom"
    />
  );
}

```
1.  Affichage conditionnel avancé

```jsx
function Dashboard({ user }) {

  if (!user) return <p>Chargement...</p>;

  if (user.role === "ADMIN") {
    return <h1>Admin Panel</h1>;
  }

  return <h1>User Panel</h1>;
}
```
15. Résumé des conditions
if → logique complexe
? : → afficher A ou B
&& → afficher si vrai
className dynamique → style conditionnel
filter/map → listes dynamiques
16. Règles importantes
React n'utilise pas if directement dans JSX (sauf avant return)

Utiliser :
- ternaire
- &&
- variables

Toujours garder le JSX lisible

## 13. Résumé

* **State = données internes dynamiques**
* `useState()` permet de gérer ces données
* modification → re-render automatique
* utilisé pour :

  * compteur
  * formulaire
  * affichage conditionnel
  * listes dynamiques

👉 Règle d’or :

```text
Ne jamais modifier directement le state
Toujours utiliser setState
```

---



# Étape suivante

👉 **useEffect (effets de bord)**

Permet de :

* appeler une API
* exécuter du code au chargement
* écouter des changements

---

🔥 Tu viens de comprendre le cœur de React.

👉 Si tu maîtrises ça + props
➡️ tu peux déjà créer **de vraies applications**.

Prochaine étape logique :
👉 **Étape 4 — useEffect + appels API + cycle de vie**
