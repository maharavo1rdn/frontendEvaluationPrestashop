import { useRef, useState } from "react";
import { importProductsFromCSV } from "../../services/csv/product.csv.service";

const ProductImport = () => {
  const fileRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return alert("Sélectionnez un fichier CSV.");

    setRunning(true);
    setResults(null);
    setProgress({ done: 0, total: 0 });

    const result = await importProductsFromCSV(file, ({ done, total }) => {
      setProgress({ done, total });
    });

    setResults(result);
    setRunning(false);
  };

  return (
    <div className="p-8 max-w-xl space-y-4">
      <h2 className="text-lg font-bold text-slate-900">
        Import CSV — Produits
      </h2>

      {/* Input file — pas de nom en dur */}
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
        {running ? "Import en cours…" : "Lancer l'import"}
      </button>

      {/* Barre de progression */}
      {progress && progress.total > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            {progress.done} / {progress.total} produits traitées
          </p>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-sky-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Résultats */}
      {results && (
        <div className="space-y-2 text-sm">
          <p className="text-emerald-600 font-semibold">
            ✓ {results.success.length} importées
          </p>
          {results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              <p className="text-red-600 font-semibold">
                ✗ {results.errors.length} erreurs
              </p>
              {results.errors.map((e, i) => (
                <p key={i} className="text-red-500 text-xs">
                  {e.name} — {e.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ProductImport;
