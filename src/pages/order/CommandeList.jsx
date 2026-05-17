import { useEffect, useState, useMemo } from "react";
import { getAll } from "../../services/order.service";
import { postOrderHistory } from "../../services/orderHistory.service";
import { getUnorderedCarts } from "../../services/cart.service";
import { findProductByKeyValue } from "../../services/product.service";
import { findCombinationsByProductId } from "../../services/combination.service";
import {
  getTaxRateForGroup,
  computeCombinationPrice,
} from "../../services/frontoffice/pricing.service";
import { Box, Loader2, Package, CalendarRange, Search, X } from "lucide-react";

const CommandeList = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [allCarts, setAllCarts] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [cartsLoading, setCartsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  // ── Chargement initial une seule fois ──
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setError(null);
    try {
      const fetchedOrders = await getAll();
      setAllOrders(fetchedOrders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchUnorderedCarts = async () => {
    setCartsLoading(true);
    try {
      const rawCarts = await getUnorderedCarts();
      const enrichedCarts = await Promise.all(
        rawCarts.map(async (cart) => {
          const rows = cart.associations?.cartRows ?? [];
          const items = [];
          let total = 0;

          for (const row of rows) {
            try {
              const products = await findProductByKeyValue("id", row.idProduct);
              const product = products?.[0];
              if (!product) continue;

              let combination = null;
              if (
                row.idProductAttribute &&
                String(row.idProductAttribute) !== "0"
              ) {
                const combos = await findCombinationsByProductId(
                  product.id
                ).catch(() => []);
                combination = combos.find(
                  (c) => String(c.id) === String(row.idProductAttribute)
                );
              }

              const taxRate = await getTaxRateForGroup(
                product.idTaxRulesGroup
              ).catch(() => 0);
              const { priceIncl } = computeCombinationPrice({
                basePrice: product.price ?? 0,
                combinationPriceImpact: combination?.price ?? 0,
                taxRate,
              });

              items.push({
                name: product.name || "Inconnu",
                reference: product.reference || "-",
                quantity: row.quantity,
                unitPriceTtc: Number(priceIncl),
              });
              total += Number(priceIncl) * row.quantity;
            } catch (err) {
              console.warn("Erreur enrichissement produit", row.idProduct, err);
              items.push({
                name: `Produit #${row.idProduct}`,
                reference: "-",
                quantity: row.quantity,
                unitPriceTtc: 0,
              });
            }
          }

          return { ...cart, items, total };
        })
      );
      setAllCarts(enrichedCarts);
    } catch (err) {
      console.error("Impossible de charger les paniers non commandés", err);
    } finally {
      setCartsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchUnorderedCarts();
  }, []);

  // ── Filtrage purement JS, aucune requête ──
  const isInRange = (dateStr, from, to) => {
    if (!from && !to) return true;
    if (!dateStr) return true;
    const date = new Date(dateStr.split(" ")[0]);
    if (from && date < new Date(from)) return false;
    if (to && date > new Date(to)) return false;
    return true;
  };

  const orders = useMemo(
    () => allOrders.filter((o) => isInRange(o.dateAdd, appliedFrom, appliedTo)),
    [allOrders, appliedFrom, appliedTo]
  );

  const unorderedCarts = useMemo(
    () => allCarts.filter((c) => isInRange(c.dateAdd, appliedFrom, appliedTo)),
    [allCarts, appliedFrom, appliedTo]
  );

  const handleFilter = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedFrom("");
    setAppliedTo("");
  };

  const handleUpdateState = async (idOrder, idOrderState) => {
    try {
      setStatus("Mise à jour de l'état...");
      await postOrderHistory({ idOrder, idOrderState });
      setStatus("État mis à jour avec succès !");
      // Juste un re-fetch des commandes, le filtre JS se ré-applique automatiquement
      await fetchOrders();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const isFiltered = appliedFrom || appliedTo;

  if (ordersLoading && cartsLoading) {
    return (
      <div className="flex justify-center py-32 text-gray-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (error) return <div className="p-4 text-red-500">Erreur : {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Liste des commandes
      </h1>

      {status && (
        <div
          className={`mb-4 p-3 rounded shadow-sm ${
            status.includes("Erreur")
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status}
        </div>
      )}

      {/* ── Filtre par dates ── */}
      <div className="mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-slate-600 font-semibold">
          <CalendarRange size={18} />
          <span>Filtrer par période</span>
        </div>

        <div className="flex flex-wrap gap-4 items-end flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Du
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Au
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <button
            onClick={handleFilter}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Search size={14} />
            Filtrer
          </button>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-300 rounded-lg px-3 py-2 transition-colors"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}
        </div>

        {isFiltered && (
          <div className="flex gap-3 ml-auto">
            <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-3 py-1 font-medium">
              {unorderedCarts.length} panier
              {unorderedCarts.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-3 py-1 font-medium">
              {orders.length} commande{orders.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Paniers non commandés */}
      {cartsLoading ? (
        <div className="py-4 text-center text-gray-500">
          Chargement des paniers en cours...
        </div>
      ) : (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package size={20} />
            Paniers en cours (non commandés)
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Panier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total estimé
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unorderedCarts.length > 0 ? (
                  unorderedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        #{cart.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cart.dateAdd
                          ? new Date(cart.dateAdd).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <ul className="list-disc list-inside space-y-1">
                          {cart.items.map((item, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{item.name}</span>
                              {item.reference !== "-" && (
                                <span className="text-gray-400 ml-1">
                                  ({item.reference})
                                </span>
                              )}
                              <span className="text-gray-500 ml-2">
                                x{item.quantity}
                              </span>
                              <span className="text-gray-600 ml-2 font-medium">
                                {item.unitPriceTtc.toFixed(2)} € / unité
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {cart.total.toFixed(2)} €
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      {isFiltered
                        ? "Aucun panier sur cette période."
                        : "Aucun panier non commandé."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Commandes */}
      {ordersLoading ? (
        <div className="py-4 text-center text-gray-500">
          Chargement des commandes...
        </div>
      ) : (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Box size={20} />
            Commandes reçues
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client (ID)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total payé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    État Actuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.dateAdd
                          ? new Date(order.dateAdd).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.idCustomer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parseFloat(order.totalPaidTaxIncl).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {order.current_state_label || order.currentState}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {order.currentState != 11 && (
                          <button
                            onClick={() => handleUpdateState(order.id, 11)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700"
                          >
                            Paiement effectué
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateState(order.id, 6)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                        >
                          Annuler
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      {isFiltered
                        ? "Aucune commande sur cette période."
                        : "Aucune commande trouvée."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default CommandeList;
