import { useRef, useState, useCallback } from "react";
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Play,
  Terminal,
} from "lucide-react";
import { importProductsFromCSV } from "../../services/csv/product.csv.service";
import importProductOptionsFromCSV from "../../services/csv/productOption.csv.service";
import importOrdersFromCSV from "../../services/csv/customerOrder.service";
import importProductImagesFromZip from "../../services/zip/productImage.zip.service";
import { validateAllFiles } from "../../services/csv/validator.service";
import { resetAllTables } from "../../services/reset.service";
import { getTopCustomer } from "../../services/customer.service";

const STEPS = [
  {
    key: "products",
    label: "Produits",
    sublabel: "CSV — colonnes: nom, reference, prix_ttc, categorie…",
    accept: ".csv",
    service: importProductsFromCSV,
  },
  {
    key: "options",
    label: "Options produits",
    sublabel: "CSV — colonnes: reference, specificité, karazany, stock…",
    accept: ".csv",
    service: importProductOptionsFromCSV,
  },
  {
    key: "orders",
    label: "Clients & achats",
    sublabel: "CSV — colonnes: client, commande, produit…",
    accept: ".csv",
    service: importOrdersFromCSV,
  },
  {
    key: "images",
    label: "Images produits",
    sublabel: "ZIP — nom de fichier = référence produit (ex: T_01.png)",
    accept: ".zip",
    service: importProductImagesFromZip,
  },
];

const STATUS = {
  idle: "idle",
  running: "running",
  done: "done",
  error: "error",
  skipped: "skipped",
};

const statusStyles = {
  idle: { bg: "bg-slate-100", text: "text-slate-500" },
  running: { bg: "bg-blue-100", text: "text-blue-600" },
  done: { bg: "bg-emerald-100", text: "text-emerald-600" },
  error: { bg: "bg-red-100", text: "text-red-500" },
  skipped: { bg: "bg-slate-100", text: "text-slate-400" },
};

const statusLabel = {
  idle: "En attente",
  running: "En cours…",
  done: "Terminé",
  error: "Erreur",
  skipped: "Ignoré",
};

export default function ImportAll() {
  const fileRefs = useRef({});
  const logEndRef = useRef(null);

  const [stepStatus, setStepStatus] = useState(() =>
    Object.fromEntries(
      STEPS.map((s) => [
        s.key,
        { status: STATUS.idle, progress: null, result: null },
      ])
    )
  );
  const [skipImages, setSkipImages] = useState(false);
  const handleSkipImagesChange = () => {
    setSkipImages(!skipImages);
  };
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [globalDone, setGlobalDone] = useState(false);

  const pushLog = useCallback((type, message) => {
    setLogs((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), type, message }];
      setTimeout(
        () => logEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
      return next;
    });
  }, []);

  const setStatus = useCallback((key, patch) => {
    setStepStatus((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const handleImport = async () => {
    setRunning(true);
    setGlobalDone(false);
    setLogs([]);
    setStepStatus(
      Object.fromEntries(
        STEPS.map((s) => [
          s.key,
          { status: STATUS.idle, progress: null, result: null },
        ])
      )
    );

    pushLog("info", "═══════════ Import global démarré ═══════════");

    const selectedFiles = Object.fromEntries(
      STEPS.map((step) => [step.key, fileRefs.current[step.key]?.files?.[0]])
    );
    const selectedCsvFiles = {
      products: selectedFiles.products,
      productOptions: selectedFiles.options,
      orders: selectedFiles.orders,
    };
    const hasCsvFile = Object.values(selectedCsvFiles).some(Boolean);

    if (hasCsvFile) {
      pushLog(
        "info",
        "[Validation] Lecture complète des CSV en mémoire avant import..."
      );

      try {
        const validation = await validateAllFiles(selectedCsvFiles);

        if (!validation.valid) {
          Object.entries(selectedCsvFiles).forEach(([key, file]) => {
            if (!file) return;
            const stepKey = key === "productOptions" ? "options" : key;
            setStatus(stepKey, { status: STATUS.error });
          });

          validation.errors.forEach((error) => {
            const line = error.line ? ` ligne ${error.line}` : "";
            pushLog(
              "error",
              `[Validation] ${error.file}${line} — ${error.message}`
            );
          });
          pushLog(
            "error",
            "[Validation] Import annulé : aucune donnée n'a été envoyée en base."
          );
          setRunning(false);
          return;
        }

        pushLog(
          "success",
          "[Validation] Feu vert : colonnes, dates et montants conformes."
        );
      } catch (err) {
        pushLog("error", `[Validation] Échec de lecture CSV — ${err.message}`);
        pushLog(
          "error",
          "[Validation] Import annulé : aucune donnée n'a été envoyée en base."
        );
        setRunning(false);
        return;
      }
    }

    let resetPromise = null;
    let importAborted = false;

    for (const step of STEPS) {
      const file = selectedFiles[step.key];

      if (!file) {
        setStatus(step.key, { status: STATUS.skipped });
        pushLog("warn", `[${step.label}] Aucun fichier — ignoré.`);
        continue;
      }

      pushLog("info", `[${step.label}] Démarrage avec "${file.name}"…`);
      setStatus(step.key, {
        status: STATUS.running,
        progress: { done: 0, total: 0 },
      });

      try {
        if (skipImages && step.key === "images") {
          pushLog(
            "info",
            `[${step.label}] Ignoré volontairement (case cochée).`
          );
          setStatus(step.key, { status: STATUS.skipped });
          continue;
        }
        const result = await step.service(
          file,
          ({ done, total, result: rowResult }) => {
            setStatus(step.key, { progress: { done, total } });
            if (rowResult) {
              const name =
                rowResult.name ||
                rowResult.reference ||
                rowResult.productReference ||
                `ligne ${done}`;

              if (!rowResult.success) {
                pushLog("error", `Erreur lors de l'import: ${rowResult.error}`);
                if (!resetPromise) {
                  pushLog("info", "Réinitialisation en cours...");
                  resetPromise = resetAllTables().then(() => {
                    pushLog(
                      "info",
                      "═══════════ Base de données réinitialisée ═══════════"
                    );
                  });
                }
                importAborted = true;
                setStatus(step.key, { status: STATUS.error });
                throw new Error("AbortImport");
              }

              pushLog(
                rowResult.success ? "success" : "error",
                `[${step.label}] ${rowResult.success ? "✓" : "✗"} ${name}${
                  !rowResult.success ? ` — ${rowResult.error || "Erreur"}` : ""
                }`
              );
            }
          }
        );

        setStatus(step.key, { status: STATUS.done, result });
        pushLog(
          result.errors.length === 0 ? "success" : "warn",
          `[${step.label}] Terminé — ${result.success.length} succès, ${result.errors.length} erreur(s).`
        );
      } catch (err) {
        if (importAborted) {
          if (resetPromise) await resetPromise;
          break;
        } else {
          setStatus(step.key, { status: STATUS.error });
          pushLog("error", `[${step.label}] Échec — ${err.message}`);
        }
      }
    }

    pushLog("info", "═══════════ Import global terminé ════════════");
    setRunning(false);
    setGlobalDone(true);
  };

  const logColors = {
    success: "text-emerald-400",
    error: "text-red-400",
    warn: "text-amber-400",
    info: "text-slate-400",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Import global</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez les fichiers dans l'ordre, puis lancez tout en une seule
          fois. Les étapes sans fichier sont ignorées automatiquement.
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
        <input
          type="checkbox"
          checked={skipImages}
          onChange={handleSkipImagesChange}
          className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
          id="skip-images"
        />
        <label
          htmlFor="skip-images"
          className="font-medium text-slate-700 cursor-pointer select-none"
        >
          Ne pas importer les images
        </label>
      </div>
      {/* Steps card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        {STEPS.map((step, i) => {
          const s = stepStatus[step.key];
          const styles = statusStyles[s.status];
          const isLast = i === STEPS.length - 1;

          return (
            <div
              key={step.key}
              className={`grid grid-cols-1 sm:grid-cols-[2rem_1fr_auto] items-start sm:items-center gap-3 sm:gap-4 p-4 ${
                isLast ? "" : "border-b border-slate-100"
              }`}
            >
              {/* Step number */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${styles.bg} ${styles.text}`}
              >
                {s.status === STATUS.done ? (
                  <CheckCircle2 size={14} />
                ) : s.status === STATUS.error ? (
                  <XCircle size={14} />
                ) : s.status === STATUS.running ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  i + 1
                )}
              </div>

              {/* Labels + file input + progress */}
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-900">
                    {step.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {step.sublabel}
                  </span>
                </div>

                <input
                  type="file"
                  accept={step.accept}
                  disabled={running}
                  ref={(el) => (fileRefs.current[step.key] = el)}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-1.5 file:px-3 file:rounded-md
                    file:border-0 file:text-xs file:font-semibold
                    file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />

                {s.status === STATUS.running && s.progress?.total > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-sky-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${
                            (s.progress.done / s.progress.total) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {s.progress.done} / {s.progress.total}
                    </span>
                  </div>
                )}
              </div>

              {/* Status badge */}
              <div
                className={`text-xs font-medium whitespace-nowrap min-w-[60px] sm:text-right ${styles.text}`}
              >
                {s.result
                  ? `${s.result.success.length}✓ ${s.result.errors.length}✗`
                  : statusLabel[s.status]}
              </div>
            </div>
          );
        })}
      </div>
      {/* Launch button */}
      <button
        onClick={handleImport}
        disabled={running}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
          bg-sky-500 hover:bg-sky-600 text-white
          disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {running ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Import en cours…
          </>
        ) : globalDone ? (
          <>
            <RefreshCw size={16} />
            Relancer l'import
          </>
        ) : (
          <>
            <Play size={16} />
            Lancer l'import global
          </>
        )}
      </button>
      {/* Log console */}
      {logs.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-500">
              Journal d'import
            </span>
            <span className="ml-auto text-xs text-slate-400">
              {logs.length} entrée{logs.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed">
            {logs.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <span className="text-slate-600 shrink-0 select-none">
                  {new Date().toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className={logColors[entry.type] || "text-slate-400"}>
                  {entry.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
