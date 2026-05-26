# Guide Export PDF en React

---

# 1. Les librairies les plus utilisées pour exporter un PDF

## jspdf

Très utilisée pour générer des PDF côté frontend.

Installation :

```bash
npm install jspdf
```

---

## jspdf-autotable

Permet de générer des tableaux automatiquement.

Installation :

```bash
npm install jspdf jspdf-autotable
```

---

## html2canvas

Permet de transformer une partie HTML en image avant export PDF.

Installation :

```bash
npm install html2canvas
```

---

# 2. Exemple PDF simple avec jsPDF

```jsx
import jsPDF from "jspdf";

function ExportPDF() {
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.text("Bonjour PDF", 10, 10);

    doc.save("document.pdf");
  };

  return (
    <button onClick={generatePDF}>
      Export PDF
    </button>
  );
}
```

---

# 3. Explication importante

## doc.text()

```js
doc.text("Bonjour", x, y)
```

* premier argument : texte
* deuxième : position X
* troisième : position Y

---

## doc.save()

```js
doc.save("file.pdf")
```

Télécharge automatiquement le fichier.

---

# 4. Exporter un tableau en PDF

## Installation

```bash
npm install jspdf jspdf-autotable
```

---

## Exemple

```jsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ExportTablePDF() {
  const generatePDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["ID", "Nom", "Age"]],
      body: [
        [1, "Jean", 20],
        [2, "Marie", 25],
      ],
    });

    doc.save("users.pdf");
  };

  return (
    <button onClick={generatePDF}>
      Export Users PDF
    </button>
  );
}
```

---

# 5. Résultat

Le PDF contiendra un tableau :

```txt
ID | Nom   | Age
1  | Jean  | 20
2  | Marie | 25
```

---

# 6. Générer le tableau dynamiquement

```jsx
const users = [
  {
    id: 1,
    nom: "Jean",
    age: 20,
  },
  {
    id: 2,
    nom: "Marie",
    age: 25,
  },
];

const body = users.map((u) => [
  u.id,
  u.nom,
  u.age,
]);
```

Puis :

```js
autoTable(doc, {
  head: [["ID", "Nom", "Age"]],
  body,
});
```

---

# 7. Exporter du HTML en PDF

## Installation

```bash
npm install jspdf html2canvas
```

---

## Exemple

```jsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ExportHTMLPDF() {
  const generatePDF = async () => {
    const element = document.getElementById("pdf-content");

    const canvas = await html2canvas(element);

    const imgData = canvas.toDataURL("image/png");

    const doc = new jsPDF();

    doc.addImage(imgData, "PNG", 10, 10, 180, 100);

    doc.save("html.pdf");
  };

  return (
    <div>
      <div id="pdf-content">
        <h1>Bonjour</h1>
        <p>Export HTML vers PDF</p>
      </div>

      <button onClick={generatePDF}>
        Export HTML PDF
      </button>
    </div>
  );
}
```

---

# 8. Quand utiliser chaque méthode ?

## jsPDF simple

Pour :

* texte
* petits rapports
* tickets
* documents simples

---

## jspdf-autotable

Pour :

* tableaux
* rapports de données
* exports Excel-like
* factures

---

## html2canvas

Pour :

* capturer une interface React
* exporter une page stylée
* convertir des composants HTML en PDF

---

# 9. Bonne pratique professionnelle

## Ne jamais exporter directement le state brut

Mauvais :

```js
users
```

---

## Préparer les données avant export

```js
const pdfData = users.map((u) => ({
  ID: u.id,
  Nom: `${u.firstName} ${u.lastName}`,
  Age: u.age,
}));
```

---

# 10. Générer plusieurs pages

```js
const doc = new jsPDF();

doc.text("Page 1", 10, 10);

doc.addPage();

doc.text("Page 2", 10, 10);
```

---

# 11. Changer l'orientation

## Portrait

```js
const doc = new jsPDF();
```

---

## Landscape

```js
const doc = new jsPDF({
  orientation: "landscape",
});
```

---

# 12. Changer la taille du texte

```js
doc.setFontSize(20);
```

Puis :

```js
doc.text("Titre", 10, 10);
```

---

# 13. Ajouter une image

```js
doc.addImage(imageData, "PNG", 10, 10, 50, 50);
```

---

# 14. Export PDF très utilisé en entreprise

```jsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ExportReport() {
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text("Rapport utilisateurs", 10, 10);

    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nom", "Email"]],
      body: [
        [1, "Jean", "jean@test.com"],
        [2, "Marie", "marie@test.com"],
      ],
    });

    doc.save("rapport.pdf");
  };

  return (
    <button onClick={generatePDF}>
      Télécharger PDF
    </button>
  );
}
```

---

# 15. Résumé

## Export texte simple

```js
jspdf
```

---

## Export tableau

```js
jspdf-autotable
```

---

## Export interface HTML

```js
html2canvas
```

---

# 16. Stack très utilisée

Frontend React :

```txt
jspdf + jspdf-autotable
```

Très fréquent dans :

* ERP
* dashboard
* reporting
* facturation
* gestion de stock
* télémédecine
