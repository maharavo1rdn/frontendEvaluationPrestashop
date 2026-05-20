import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getOrderById, duplicateOrder } from "../../services/order.service";
import { findCartByKeyValue } from "../../services/cart.service";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Copy,
  ShoppingCart,
  CheckCircle,
} from "lucide-react";
import { findStockAvailableByProductAttribute } from "../../services/stockAvailable.service";

const DuplicateOrder = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const factor = parseFloat(searchParams.get("quantity") || "1");

  const [order, setOrder] = useState(null);
  const [orderCart, setOrderCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [duplicating, setDuplicating] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);

  const [stockTab, setStockTab] = useState([]);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!orderId) throw new Error("Paramètre orderId manquant");
        const fetchedOrder = await getOrderById(orderId);
        setOrder(fetchedOrder);

        if (fetchedOrder?.idCart) {
          const carts = await findCartByKeyValue("id", fetchedOrder.idCart);
          setOrderCart(carts?.[0] ?? null);
        }

        await loadStocks(fetchedOrder);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  const loadStocks = async (fetchedOrder) => {
    const tab = {};

    await Promise.all(
      fetchedOrder.associations.orderRows.map(async (row) => {
        const stocks = await findStockAvailableByProductAttribute(
          row.productId,
          row.productAttributeId
        );
        tab[row.productId] = {
          name: row.productName,
          stock: stocks[0].quantity,
          requested: row.productQuantity * Number(factor),
        };
      })
    );
    setStockTab(tab);
    const hasStockIssue =
      Object.keys(tab).length > 0 &&
      Object.values(tab).some((info) => stock < requested);
    setIsOutOfStock(hasStockIssue);
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    setDuplicateError(null);
    setDuplicateResult(null);
    try {
      const result = await duplicateOrder(orderId, factor);
      if (result && result.success) {
        setDuplicateResult(result);
      } else {
        throw new Error(result?.error || "Échec de la duplication");
      }
    } catch (err) {
      setDuplicateError(err.message);
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Link
          to="/frontOffice/commandes/customers"
          className="mt-4 inline-flex items-center gap-2 text-sky-500 font-medium"
        >
          <ArrowLeft size={16} /> Retour aux commandes
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-gray-500">Commande introuvable.</div>
    );
  }

  const rows = order?.associations?.orderRows ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dupliquer la commande
          </h1>
          <p className="text-sm text-slate-500">
            Commande #{order.id} — Réf : {order.reference}
          </p>
        </div>
        <Link
          to="/frontOffice/commandes/customers"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-500"
        >
          <ArrowLeft size={16} />
          Retour aux commandes
        </Link>
      </div>
      {/* Résultat de la duplication */}
      {duplicateResult && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">
              Duplication réussie !
            </p>
            <p className="text-sm text-emerald-700">
              Nouvelle commande{" "}
              <span className="font-bold">#{duplicateResult.orderId}</span>{" "}
              créée
              {duplicateResult.reference &&
                ` (réf. ${duplicateResult.reference})`}
              .
            </p>
          </div>
        </div>
      )}
      {duplicateError && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} />
          <div>
            <p className="text-sm font-medium">Erreur lors de la duplication</p>
            <p className="text-xs mt-1">{duplicateError}</p>
          </div>
        </div>
      )}
      {/* Détails de la commande originale */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Commande originale
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Client</dt>
            <dd className="font-medium text-slate-900">#{order.idCustomer}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="font-medium text-slate-900">
              {order.dateAdd
                ? new Date(order.dateAdd).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Total payé</dt>
            <dd className="font-medium text-slate-900">
              {parseFloat(order.totalPaidTaxIncl).toFixed(2)} €
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Facteur</dt>
            <dd className="font-medium text-sky-600">x{factor}</dd>
          </div>
        </dl>
      </div>
      {/* Vérification des stocks */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Vérification des stocks
        </h2>
        <div className="space-y-3">
          {Object.keys(stockTab).length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune information de stock disponible.
            </p>
          ) : (
            Object.entries(stockTab).map(([productId, info]) => {
              const isStockOk = info.stock >= info.requested;
              return (
                <div
                  key={productId}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-sm text-slate-900">
                      {info.name}
                    </p>
                    <p className="text-xs text-slate-500">ID: {productId}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Stock dispo</p>
                      <p
                        className={`font-semibold ${
                          isStockOk ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {info.stock}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Demandé</p>
                      <p className="font-semibold text-slate-900">
                        {info.requested}
                      </p>
                    </div>
                    {!isStockOk && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Insuffisant
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>{" "}
      {/* Lignes de commande */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Lignes de commande
          </h2>
        </div>
        {rows.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Produit
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Prix unitaire
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                  Qté originale
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                  Nouvelle qté
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Total ligne
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const originalQty = parseInt(row.productQuantity, 10) || 1;
                const newQty = Math.round(originalQty * factor);
                const unitPrice = parseFloat(row.unitPriceTaxIncl || 0);
                const lineTotal = unitPrice * newQty;

                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-900">
                        {row.productName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {row.productReference}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-700">
                      {unitPrice.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600">
                      {originalQty}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-semibold text-sm">
                        {newQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
                      {lineTotal.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            Aucune ligne de commande trouvée.
          </div>
        )}
      </div>
      {/* Action */}
      {isOutOfStock && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          Certains produits sont en rupture de stock. La duplication est
          impossible.
        </p>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleDuplicate}
          disabled={duplicating || isOutOfStock}
          className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {duplicating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Copy size={18} />
          )}
          {duplicating ? "Duplication en cours…" : "Dupliquer la commande"}
        </button>
      </div>
    </div>
  );
};

export default DuplicateOrder;
