# Étape 8 — Routage en React (React Router)

---

# 1. C’est quoi le routage ? (LE "QUOI")

Le **routage** permet de naviguer entre différents composants (pages) dans une application React.

👉 Exemple :

* `/login`
* `/dashboard`
* `/profile`

Chaque URL correspond à un composant.

```text
/login      → Login component
/dashboard  → Dashboard component
/profile    → Profile component
```

---

# 2. Pourquoi utiliser le routage ? (LE "POURQUOI")

Parce qu’une vraie application contient plusieurs pages :

Exemples :

* login
* dashboard
* utilisateurs
* produits
* paramètres

👉 Sans routage :

* une seule page

👉 Avec routage :

* application structurée
* navigation propre
* UX professionnelle

---

# 3. La librairie standard : React Router

La librairie officielle :

```bash
npm install react-router-dom
```

---

# 4. Structure typique d’une app avec routage

```text
src/
│
├── App.jsx
├── pages/
│     ├── Login.jsx
│     ├── Dashboard.jsx
│     └── Profile.jsx
│
└── components/
```

---

# 5. Configuration de base du routage

## App.jsx

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Explication

```text
BrowserRouter → active le routage
Routes        → contient les routes
Route         → définit une page
path          → URL
element       → composant affiché
```

---

# 6. Navigation entre pages

## Méthode 1 — Link (navigation utilisateur)

```jsx
import { Link } from "react-router-dom";

function Menu() {
  return (
    <div>
      <Link to="/dashboard">
        Dashboard
      </Link>
    </div>
  );
}
```

---

Pourquoi utiliser `Link` ?

Parce que :

* navigation sans recharger la page
* rapide
* SPA (Single Page Application)

---

# 7. Redirection après un login (très important)

C’est le cas réel le plus courant.

---

## Exemple : Login.jsx

```jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (email === "admin" && password === "123") {

      navigate("/dashboard");

    }
  }

  return (
    <form onSubmit={handleLogin}>

      <input
        type="text"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">
        Login
      </button>

    </form>
  );
}

export default Login;
```

---

## Pourquoi `useNavigate` ?

Parce que :

```text
navigate("/dashboard")
```

permet :

* redirection programmatique
* après login
* après sauvegarde
* après suppression

---

# 8. Bonnes pratiques — Routage après login

Toujours :

```text
1) vérifier login
2) stocker session / token
3) rediriger
```

---

Exemple :

```jsx
localStorage.setItem("token", "123");

navigate("/dashboard");
```

---

# 9. Route protégée (Protected Route)

Très important dans une vraie application.

Empêche l’accès sans login.

---

## ProtectedRoute.jsx

```jsx
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## Utilisation dans App.jsx

```jsx
import ProtectedRoute from "./ProtectedRoute";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

Pourquoi ?

Parce que :

```text
Si pas connecté → redirection login
Si connecté → accès autorisé
```

---

# 10. Layout avec Header / Sidebar

Bonne pratique professionnelle.

---

## App.jsx

```jsx
<BrowserRouter>

  <Layout>

    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />

    </Routes>

  </Layout>

</BrowserRouter>
```

---

## Layout.jsx

```jsx
function Layout({ children }) {
  return (
    <div>

      <header>
        Header
      </header>

      <main>
        {children}
      </main>

    </div>
  );
}

export default Layout;
```

---

Pourquoi ?

Parce que :

```text
Header / Sidebar restent visibles
Seule la page change
```

---

# 11. Paramètres dans l’URL (Route Params)

Exemple :

```text
/user/5
```

---

## Route

```jsx
<Route path="/user/:id" element={<User />} />
```

---

## User.jsx

```jsx
import { useParams } from "react-router-dom";

function User() {

  const { id } = useParams();

  return (
    <h1>User ID : {id}</h1>
  );
}
```

---

Pourquoi ?

Parce que :

```text
permet d'afficher un utilisateur spécifique
```

---

# 12. Routes 404 (page non trouvée)

Bonne pratique.

```jsx
<Route path="*" element={<h1>Page not found</h1>} />
```

---

Pourquoi ?

Parce que :

```text
évite erreur si URL inconnue
```

---

# 13. Résumé — Hooks du routage

| Hook        | Sert à                  |
| ----------- | ----------------------- |
| useNavigate | redirection             |
| useParams   | lire paramètres URL     |
| Link        | navigation              |
| Navigate    | redirection automatique |

---

# 14. Architecture recommandée (bonne pratique)

```text
src/

pages/
    Login.jsx
    Dashboard.jsx
    Users.jsx

components/
    Navbar.jsx
    Sidebar.jsx

routes/
    ProtectedRoute.jsx

App.jsx
```

---

# Cas réel complet

```text
Login → vérification → stocker token → navigate → Dashboard
```

---

# Étape suivante (logique)

Après le routage, on apprend :

* gestion d’authentification
* gestion des tokens
* appels API sécurisés
* logout
* refresh page

---

Quand tu voudras, je pourrai faire :

* **authentification complète (login / logout)**
* **CRUD avec routing**
* **structure professionnelle React**
* **exercices pratiques sur le routing**
