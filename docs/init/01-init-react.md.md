# Étape 0 — Initialiser un projet React

## 1. Introduction

Avant de commencer à développer avec React, il faut créer un **projet React**.

Un projet React contient :

* la structure du projet
* les dépendances JavaScript
* un serveur de développement
* un système de compilation

Aujourd’hui, la méthode la plus moderne pour créer un projet React est **Vite**.

Pourquoi Vite ?

* démarrage très rapide
* configuration simple
* très utilisé dans les nouveaux projets

---

# 2. Prérequis

Avant d'initialiser un projet React, il faut installer **Node.js**.

Vérifier l'installation :

```bash
node -v
```

et

```bash
npm -v
```

Si les versions s'affichent, tout est prêt.

---

# 3. Créer un projet React avec Vite

Commande pour créer un projet :

```bash
npm create vite@latest mon-projet-react
```

Explication :

* `npm create` → lance le créateur de projet
* `vite@latest` → utilise Vite
* `mon-projet-react` → nom du projet

---

# 4. Choisir les options

Après la commande, le terminal va poser des questions :

### Choisir le framework

Sélectionner :

```
React
```

### Choisir le langage

Deux choix :

```
JavaScript
ou
TypeScript
```

Pour débuter choisir :

```
JavaScript
```

---

# 5. Entrer dans le projet

Aller dans le dossier du projet :

```bash
cd mon-projet-react
```

---

# 6. Installer les dépendances

Installer les packages nécessaires :

```bash
npm install
```

Cela installe :

* React
* ReactDOM
* Vite
* les outils de développement

---

# 7. Lancer le serveur React

Démarrer le projet :

```bash
npm run dev
```

Le terminal affichera quelque chose comme :

```
Local: http://localhost:5173/
```

Ouvrir ce lien dans le navigateur.

---

# 8. Structure du projet

Une fois créé, le projet contient plusieurs fichiers importants.

```
mon-projet-react
│
├─ node_modules
├─ public
├─ src
│  ├─ App.jsx
│  ├─ main.jsx
│
├─ index.html
├─ package.json
```

### Dossier important : `src`

C'est ici que tu écriras ton code React.

---

# 9. Fichiers importants

## main.jsx

Point d'entrée de l'application.

Il connecte React au HTML.

## App.jsx

C'est le **composant principal** de l'application.

Tu modifieras souvent ce fichier.

---

# 10. Résumé

Commandes principales :

Créer projet :

```bash
npm create vite@latest mon-projet-react
```

Entrer dans le dossier :

```bash
cd mon-projet-react
```

Installer dépendances :

```bash
npm install
```

Lancer React :

```bash
npm run dev
```

---

# Étape suivante

Après avoir créé le projet, la prochaine étape sera :

**Comprendre la structure d'un projet React et le rôle des fichiers principaux.**

Nous verrons notamment :

* `main.jsx`
* `App.jsx`
* les composants React
* le fonctionnement du rendu.
