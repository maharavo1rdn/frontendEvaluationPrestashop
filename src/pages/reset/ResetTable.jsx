import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { resetCustomers } from "../../services/customer.service";
import { resetOrders } from "../../services/order.service";
import { resetCarts } from "../../services/cart.service";
import { resetOrderDetails } from "../../services/orderDetail.service";
import { resetOrderPayments } from "../../services/orderPayment.service";
import { resetProducts } from "../../services/product.service";
import { resetAllTables } from "../../services/reset.service";
import { resetProductFeatureValues } from "../../services/productFeatureValue.service";
import { resetCategories } from "../../services/category.service";
import { resetCombinations } from "../../services/combination.service";

const RESET_TABLES = [
  {
    id: "customers",
    label: "customers",
    table: "ps_customer",
    description: "Comptes clients",
    reset: resetCustomers,
  },
  {
    id: "orders",
    label: "orders",
    table: "ps_orders",
    description: "Commandes principales",
    reset: resetOrders,
  },
  {
    id: "order-details",
    label: "orders_details",
    table: "ps_order_detail",
    description: "Lignes de commande",
    reset: resetOrderDetails,
  },
  {
    id: "order-payments",
    label: "order_payement",
    table: "ps_order_payment",
    description: "Paiements associes",
    reset: resetOrderPayments,
  },
  {
    id: "feature-values",
    label: "Caracteristiques",
    table: "ps_feature_value",
    description: "Valeurs des caracteristiques",
    reset: resetProductFeatureValues,
  },
  {
    id: "combinations",
    label: "combinaisons",
    table: "ps_product_attribute",
    description: "Declinaisons produits",
    reset: resetCombinations,
  },
  {
    id: "carts",
    label: "carts",
    table: "ps_cart",
    description: "Paniers clients",
    reset: resetCarts,
  },
  {
    id: "products",
    label: "products",
    table: "ps_product",
    description: "Catalogue des produits",
    reset: resetProducts,
  },
  {
    id: "categories",
    label: "categories",
    table: "ps_category",
    description: "Catalogue des catégories",
    reset: resetCategories,
  },
];

const ResetTable = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusById, setStatusById] = useState({});
  const [globalStatus, setGlobalStatus] = useState(null);

  const totalCount = RESET_TABLES.length;
  const selectedCount = selectedIds.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const selectionLabel = useMemo(() => {
    if (selectedCount === 0) return "Aucune table selectionnee";
    if (selectedCount === 1) return "1 table selectionnee";
    return `${selectedCount} tables selectionnees`;
  }, [selectedCount]);

  const updateStatus = (id, nextStatus) => {
    setStatusById((prev) => ({
      ...prev,
      [id]: {
        state: "idle",
        message: "",
        ...prev[id],
        ...nextStatus,
      },
    }));
  };

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    setSelectedIds(allSelected ? [] : RESET_TABLES.map((table) => table.id));
  };

  const handleReset = async (table) => {
    const confirmMessage = `Reinitialiser la table ${table.label} ?`;
    if (!window.confirm(confirmMessage)) return;

    updateStatus(table.id, {
      state: "loading",
      message: "Reinitialisation...",
    });
    try {
      await table.reset();
      updateStatus(table.id, {
        state: "success",
        message: "Reinitialisee",
      });
      setGlobalStatus({
        type: "success",
        message: `Table ${table.label} reinitialisee.`,
      });
    } catch (error) {
      updateStatus(table.id, {
        state: "error",
        message: error?.message || "Erreur pendant la reinitialisation",
      });
      setGlobalStatus({
        type: "error",
        message: `Erreur lors de la reinitialisation de ${table.label}.`,
      });
    }
  };

  const handleResetSelection = async () => {
    if (selectedCount === 0) return;
    const confirmMessage = `Reinitialiser ${selectedCount} table${
      selectedCount > 1 ? "s" : ""
    } ?`;
    if (!window.confirm(confirmMessage)) return;

    setGlobalStatus({
      type: "info",
      message: "Reinitialisation de la selection en cours...",
    });

    for (const id of selectedIds) {
      const table = RESET_TABLES.find((item) => item.id === id);
      if (!table) continue;
      updateStatus(id, { state: "loading", message: "Reinitialisation..." });
      try {
        await table.reset();
        updateStatus(id, { state: "success", message: "Reinitialisee" });
      } catch (error) {
        updateStatus(id, {
          state: "error",
          message: error?.message || "Erreur pendant la reinitialisation",
        });
      }
    }

    setGlobalStatus({
      type: "success",
      message: "Reinitialisation terminee pour la selection.",
    });
  };

  const handleResetAll = async () => {
    const confirmMessage = "Reinitialiser toutes les tables ?";
    if (!window.confirm(confirmMessage)) return;

    setGlobalStatus({
      type: "info",
      message: "Reinitialisation de toutes les tables en cours...",
    });

    const loadingStatus = Object.fromEntries(
      RESET_TABLES.map((table) => [
        table.id,
        { state: "loading", message: "Reinitialisation..." },
      ])
    );
    setStatusById(loadingStatus);

    try {
      await resetAllTables();
      setStatusById(
        Object.fromEntries(
          RESET_TABLES.map((table) => [
            table.id,
            { state: "success", message: "Reinitialisee" },
          ])
        )
      );
      setGlobalStatus({
        type: "success",
        message: "Toutes les tables ont ete reinitialisees.",
      });
    } catch (error) {
      setGlobalStatus({
        type: "error",
        message:
          error?.message ||
          "Erreur pendant la reinitialisation de toutes les tables",
      });
    }
  };

  const renderStatus = (tableId) => {
    const status = statusById[tableId] || { state: "idle", message: "Pret" };
    if (status.state === "loading") {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          {status.message || "En cours"}
        </span>
      );
    }

    if (status.state === "success") {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <CheckCircle2 size={14} />
          {status.message || "Termine"}
        </span>
      );
    }

    if (status.state === "error") {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-red-600">
          <AlertCircle size={14} />
          {status.message || "Erreur"}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
        {status.message || "Pret"}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-lg text-white">
            <Layers size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Reinitialisation des tables
            </h1>
            <div className="text-sm text-slate-500">
              <p className="mb-2">
                Selectionnez les tables a reinitialiser puis lancez l'action.
              </p>
              <p className="text-sm text-slate-500">
                <strong>Note:</strong> Supprimez tous les commandes avant de
                supprimer les paniers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            <Trash2 size={16} />
            Tout reinitialiser
          </button>
        </div>
      </div>

      {globalStatus && (
        <div
          className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
            globalStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : globalStatus.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          {globalStatus.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : globalStatus.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <Loader2 size={18} className="animate-spin" />
          )}
          {globalStatus.message}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <input
              type="checkbox"
              className="h-4 w-4 accent-sky-500"
              checked={allSelected}
              onChange={handleToggleAll}
              aria-label="Selectionner toutes les tables"
            />
            <span className="font-semibold text-slate-700">
              {selectionLabel}
            </span>
          </div>
          <span className="text-xs text-slate-400">{totalCount} tables</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Selection
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Table
                </th>
                {/* ── Colonne ajoutée ── */}
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Table PrestaShop
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Statut
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RESET_TABLES.map((table) => {
                const isSelected = selectedIds.includes(table.id);
                const isLoading = statusById[table.id]?.state === "loading";

                return (
                  <tr key={table.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-sky-500"
                        checked={isSelected}
                        onChange={() => handleToggle(table.id)}
                        aria-label={`Selectionner ${table.label}`}
                      />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {table.label}
                    </td>
                    {/* ── Valeur ajoutée ── */}
                    <td className="px-5 py-3.5">
                      <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
                        {table.table}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {table.description}
                    </td>
                    <td className="px-5 py-3.5">{renderStatus(table.id)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleReset(table)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        Reinitialiser
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResetTable;
