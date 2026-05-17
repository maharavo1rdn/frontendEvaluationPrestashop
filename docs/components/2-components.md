# Étape 1 — Comprendre les composants et le JSX en React

## 1. Introduction

Dans **React**, deux concepts fondamentaux sont :

* **les composants**
* **le JSX**

Si tu comprends bien ces deux notions, tu comprends déjà **une grande partie de React**.

React repose sur une idée simple :

> Une interface est composée de plusieurs **petits blocs réutilisables appelés composants**.

---

# 2. Les composants

## 2.1 Définition

Un **composant** est une **fonction JavaScript qui retourne de l’interface utilisateur**.

Autrement dit :

Un composant permet de créer un **bloc d’interface réutilisable**.

Exemples de composants dans une application :

* Navbar
* Sidebar
* Card
* Footer
* Bouton
* Profil utilisateur

---

## 2.2 Exemple simple de composant

Créer un composant :

```jsx
function Bonjour() {
  return <h1>Bonjour React</h1>;
}

export default Bonjour;
```
ou bien
```jsx
const Bonjour = () => {
  return <h1>Bonjour React</h1>;
}

export default Bonjour;
```


Utilisation dans un autre fichier :

```jsx
import Bonjour from "./Bonjour";

function App() {
  return (
    <div>
      <Bonjour />
    </div>
  );
}

export default App;
```

Résultat :

```
Bonjour React
```

---

# 3. Pourquoi utiliser des composants ?

Les composants permettent :

* de **réutiliser le code**
* d’**organiser l’interface**
* de **simplifier la maintenance**

Exemple sans composants :

```jsx
<h1>Produit 1</h1>
<p>Prix : 10€</p>

<h1>Produit 2</h1>
<p>Prix : 20€</p>

<h1>Produit 3</h1>
<p>Prix : 30€</p>
```

Code répétitif.

---

## Avec un composant

```jsx
function Produit() {
  return (
    <div>
      <h2>Nom du produit</h2>
      <p>Prix : 10€</p>
    </div>
  );
}

export default Produit;
```

Utilisation :

```jsx
import Produit from "./Produit";

function App() {
  return (
    <div>
      <Produit />
      <Produit />
      <Produit />
    </div>
  );
}

export default App;
```

Un seul composant → utilisé plusieurs fois.

---

# 4. Règles importantes des composants

## 1️⃣ Le nom doit commencer par une majuscule

Correct :

```jsx
function Header() {
  return <h1>Mon site</h1>;
}
```

Incorrect :

```jsx
function header() {
  return <h1>Mon site</h1>;
}
```

React considère les minuscules comme des balises HTML.

---

## 2️⃣ Un composant retourne un seul élément parent

Incorrect :

```jsx
function Test() {
  return (
    <h1>Titre</h1>
    <p>Texte</p>
  );
}
```

Correct :

```jsx
function Test() {
  return (
    <div>
      <h1>Titre</h1>
      <p>Texte</p>
    </div>
  );
}
```

Ou avec **Fragment** :

```jsx
function Test() {
  return (
    <>
      <h1>Titre</h1>
      <p>Texte</p>
    </>
  );
}
```

---

# 5. Le JSX

## 5.1 Définition

Le **JSX** signifie :

```
JavaScript XML
```

C’est une syntaxe qui permet d’écrire **du HTML dans JavaScript**.

Exemple JSX :

```jsx
const element = <h1>Bonjour React</h1>;
```

React transforme ce JSX en JavaScript.

---

## 5.2 Pourquoi JSX existe ?

Sans JSX :

```javascript
const element = React.createElement(
  "h1",
  null,
  "Bonjour React"
);
```

Avec JSX :

```jsx
const element = <h1>Bonjour React</h1>;
```

Beaucoup plus lisible.

---

# 6. Exemple simple avec JSX

```jsx
function App() {
  return (
    <div>
      <h1>Bienvenue</h1>
      <p>Apprendre React est intéressant</p>
    </div>
  );
}

export default App;
```

---

# 7. Insérer du JavaScript dans le JSX

Dans JSX on peut utiliser **des accolades `{}`**.

Exemple :

```jsx
function App() {
  const nom = "Jean";

  return (
    <h1>Bonjour {nom}</h1>
  );
}

export default App;
```

Résultat :

```
Bonjour Jean
```

---

## Exemple avec calcul

```jsx
function App() {
  const a = 5;
  const b = 3;

  return <h1>Résultat : {a + b}</h1>;
}

export default App;
```

Résultat :

```
Résultat : 8
```

---

# 8. Exemple réutilisable : composant carte

Créer un composant carte simple.

```jsx
function Card() {
  return (
    <div>
      <h2>Formation React</h2>
      <p>Apprendre les bases de React</p>
    </div>
  );
}

export default Card;
```

Utilisation :

```jsx
import Card from "./Card";

function App() {
  return (
    <div>
      <Card />
      <Card />
      <Card />
    </div>
  );
}

export default App;
```

---

# 9. Exemple réutilisable : composant bouton

Créer un bouton simple.

```jsx
function Button() {
  return <button>Cliquer</button>;
}

export default Button;
```

Utilisation :

```jsx
import Button from "./Button";

function App() {
  return (
    <div>
      <Button />
      <Button />
    </div>
  );
}

export default App;
```

---

# 10. Résumé

## Composants

* bloc réutilisable
* fonction JavaScript
* retourne de l’interface

Exemple :

```jsx
function Header() {
  return <h1>Mon site</h1>;
}
```

---

## JSX

Permet d’écrire **HTML dans JavaScript**.

Exemple :

```jsx
const element = <h1>Bonjour</h1>;
```

---

# Étape suivante

La prochaine étape importante sera :

**Comprendre les Props (propriétés) dans React.**

Les props permettent de :

* rendre les composants dynamiques
* envoyer des données à un composant
* réutiliser un composant avec différentes informations.
