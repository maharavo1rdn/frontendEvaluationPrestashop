# Étape 2 — Comprendre les Props en React

## 1. Introduction

Les **props** (abréviation de *properties*) permettent **d’envoyer des données à un composant**.
Grâce aux props, un composant peut devenir **dynamique et réutilisable**.

Sans props, un composant affiche toujours la même chose.
Avec props, il peut afficher **des informations différentes selon les données reçues**.

---

## 2. Principe des Props

Les props fonctionnent comme **les paramètres d’une fonction**.

### Exemple JS classique

```javascript id="n4c7c2"
function addition(a, b) {
  return a + b;
}

addition(2, 3); // 5
```

### Exemple React similaire

```jsx id="krrb0q"
function User(props) {
  return <h1>{props.name}</h1>;
}

<User name="Jean" />
<User name="Marie" />
```

Résultat :

```id="qbyzcb"
Jean
Marie
```

---

## 3. Exemple simple avec props

### Composant `User.jsx`

```jsx id="g6h8tt"
function User(props) {
  return (
    <div>
      <h2>Nom : {props.name}</h2>
      <p>Age : {props.age}</p>
    </div>
  );
}

export default User;
```

### Utilisation dans `App.jsx`

```jsx id="kttsqx"
import User from "./User";

function App() {
  return (
    <div>
      <User name="Jean" age={25} />
      <User name="Marie" age={30} />
      <User name="Paul" age={22} />
    </div>
  );
}

export default App;
```

Résultat affiché :

```id="up3ie1"
Nom : Jean
Age : 25

Nom : Marie
Age : 30

Nom : Paul
Age : 22
```

Le **même composant est réutilisé avec des données différentes**.

---

## 4. Syntaxe des Props

### Dans le composant

```jsx id="x3mbi2"
props.nomDeLaProp
```

Exemple :

```jsx id="iqjhh5"
props.name
props.age
props.price
```

### Dans l’utilisation du composant

```jsx id="p7jgbg"
<Component prop="valeur" />
```

Exemple :

```jsx id="q4dsra"
<User name="Jean" age={25} />
```

---

## 5. Props avec valeurs JavaScript

Quand la valeur est **JavaScript**, on utilise `{}`.

```jsx id="cb26fx"
<User age={20} />
```

Avec variable :

```jsx id="qglsaf"
function App() {
  const age = 28;
  return <User name="Jean" age={age} />
}
```

---

## 6. Destructuring des Props

Au lieu d’écrire :

```jsx id="bhnvdw"
function User(props) {
  return <h1>{props.name}</h1>;
}
```

On peut écrire :

```jsx id="sqykaw"
function User({ name }) {
  return <h1>{name}</h1>;
}
```

Exemple complet :

```jsx id="uhs7ua"
function User({ name, age }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{age}</p>
    </div>
  );
}

export default User;
```

---

## 7. Props avec listes (array)

### `App.jsx`

```jsx id="kl6tzu"
import UserList from "./UserList";

function App() {
  const users = ["Jean", "Marie", "Paul"];
  return <UserList users={users} />;
}

export default App;
```

### `UserList.jsx`

```jsx id="x0qszr"
function UserList({ users }) {
  return (
    <div>
      {users.map((user, index) => (
        <p key={index}>{user}</p>
      ))}
    </div>
  );
}

export default UserList;
```

---

## 8. Props avec objets (liste d’objets)

### `App.jsx`

```jsx id="0udl3y"
import ProductList from "./ProductList";

function App() {
  const products = [
    { id: 1, name: "Laptop", price: 900 },
    { id: 2, name: "Clavier", price: 50 },
    { id: 3, name: "Souris", price: 25 }
  ];

  return <ProductList products={products} />;
}

export default App;
```

### `ProductList.jsx`

```jsx id="r7pfgj"
function ProductList({ products }) {
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Prix : {product.price} €</p>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
```

---

## 9. Props avec fonctions (callback)

On peut passer **une fonction en prop** pour qu’un composant enfant **exécute une action dans le parent**.

### Exemple simple : bouton qui déclenche une action

#### `App.jsx`

```jsx id="fn1app"
import Button from "./Button";

function App() {
  function handleClick() {
    alert("Bouton cliqué !");
  }

  return <Button onClick={handleClick} label="Cliquer" />;
}

export default App;
```

#### `Button.jsx`

```jsx id="fn1btn"
function Button({ onClick, label }) {
  return <button onClick={onClick}>{label}</button>;
}

export default Button;
```

---

### Exemple avec plusieurs boutons

```jsx id="fn2btn"
<Button onClick={() => console.log("Envoyer")} label="Envoyer" />
<Button onClick={() => console.log("Supprimer")} label="Supprimer" />
```

✅ Très pratique pour :

* gérer des événements (`click`, `change`)
* remonter des données vers le parent
* rendre des composants réutilisables et interactifs

---

## 10. Les Props sont en lecture seule

Les props **ne doivent jamais être modifiées dans le composant**.

Incorrect :

```jsx id="dhlruy"
props.name = "Paul"
```

Correct :

* utiliser les props **pour afficher ou traiter des données**, jamais les modifier directement.
* pour les valeurs modifiables, on utilise **le state** (hook `useState`).

---

## 11. Résumé

* Les **props** permettent d’envoyer des données et fonctions à un composant
* Elles rendent les composants **dynamiques et réutilisables**
* Types de props : `string`, `number`, `boolean`, `object`, `array`, `function`
* Pour afficher une liste, utiliser `.map()`
* On peut utiliser le **destructuring** pour plus de clarté

Exemple simple :

```jsx id="oib4n3"
function User({ name }) {
  return <h1>{name}</h1>;
}

<User name="Jean" />
```

---

# Étape suivante

**Comprendre le State et le Hook `useState`**

Le **state** permet :

* gérer des données qui changent
* rendre l’interface interactive
* créer des fonctionnalités comme :

```id="tlpkb3"
compteur
formulaire
like button
todo list
```

---

Cette version couvre maintenant **tous les cas de props** : simples, listes, objets et fonctions.
Elle est prête pour l’apprentissage et la pratique.
