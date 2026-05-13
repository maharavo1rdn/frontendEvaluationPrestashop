import { useRef, useState } from "react";
import { importProductsFromCSV } from "../../services/csv/product.csv.service";
import { importCategoriesFromCSV } from "../../services/csv/category.csv.service";
import importProductOptionsFromCSV from "../../services/csv/productOption.csv.service";
import importOrdersFromCSV from "../../services/csv/customerOrder.service";
import importProductImagesFromZip from "../../services/zip/productImage.zip.service"

const ImportCard = ({ title, onImport, acceptLabel }) => {
  const fileRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return alert("Selectionnez un fichier CSV.");

    setRunning(true);
    setResults(null);
    setProgress({ done: 0, total: 0 });

    const result = await onImport(file, ({ done, total }) => {
      setProgress({ done, total });
    });

    setResults(result);
    setRunning(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{acceptLabel}</p>

      <div className="mt-4 space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4 file:rounded-md
            file:border-0 file:text-sm file:font-semibold
            file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
        />

        <button
          onClick={handleImport}
          disabled={running}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white
            text-sm font-semibold rounded-md disabled:opacity-50"
        >
          {running ? "Import en cours..." : "Lancer l'import"}
        </button>
      </div>

      {progress && progress.total > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-xs text-slate-500">
            {progress.done} / {progress.total} lignes traitees
          </p>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-sky-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-emerald-600 font-semibold">
            ✓ {results.success.length} importees
          </p>
          {results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              <p className="text-red-600 font-semibold">
                ✗ {results.errors.length} erreurs
              </p>
              {results.errors.map((entry, index) => (
                <p key={index} className="text-red-500 text-xs">
                  {entry.name} — {entry.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ImportAll = () => {
  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import CSV</h1>
        <p className="text-sm text-slate-500">
          Importez les categories et les produits depuis des fichiers CSV.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ImportCard
          title="Import CSV — Produits"
          acceptLabel="Fichier CSV pour les produits"
          onImport={importProductsFromCSV}
        />
        <ImportCard
          title="Import CSV — Produits options"
          acceptLabel="Fichier CSV pour les options des produits "
          onImport={importProductOptionsFromCSV}
        />
        <ImportCard
          title="Import CSV — Clients et achats"
          acceptLabel="Fichier CSV pour les clients et achats"
          onImport={importOrdersFromCSV}
        />
      </div>
      <ImportCard
        title="Import ZIP — Images produits"
        acceptLabel="Fichier .zip contenant les images (nom = référence produit)"
        acceptFile=".zip"
        alertLabel="Selectionnez un fichier .zip."
        onImport={importProductImagesFromZip}
      />
    </div>
  );
};

export default ImportAll;
