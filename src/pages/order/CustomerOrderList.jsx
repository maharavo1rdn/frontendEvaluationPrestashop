import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  ShoppingCart,
  ArrowLeft,
  Package,
} from "lucide-react";
import { findOrderByKeyValue } from "../../services/order.service";
import { findOrderStateByKeyValue } from "../../services/orderState.service";
import { getCustomerSession } from "../../services/frontoffice/session.service";
import { getUnorderedCartsByCustomer } from "../../services/cart.service";
import { findProductByKeyValue } from "../../services/product.service";
import { findCombinationsByProductId } from "../../services/combination.service";
import {
  getTaxRateForGroup,
  computeCombinationPrice,
} from "../../services/frontoffice/pricing.service";

const CustomerOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [unorderedCarts, setUnorderedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const customer = getCustomerSession();
        if (!customer?.id) {
          throw new Error(
            "Vous devez être connecté pour consulter vos commandes."
          );
        }

        const fetchedOrders = await findOrderByKeyValue(
          "id_customer",
          customer.id
        );
        const enrichedOrders = await Promise.all(
          fetchedOrders.map(async (order) => {
            let stateName = order.currentState;
            try {
              const states = await findOrderStateByKeyValue(
                "id",
                order.currentState
              );
              if (states && states.length > 0) {
                stateName = states[0].name || order.currentState;
              }
            } catch {}
            return { ...order, stateName };
          })
        );
        setOrders(enrichedOrders);

        try {
          const rawCarts = await getUnorderedCartsByCustomer(customer.id);
          const enrichedCarts = await Promise.all(
            rawCarts.map(async (cart) => {
              const rows = cart.associations?.cartRows ?? [];
              const items = [];
              let total = 0;

              for (const row of rows) {
                try {
                  const products = await findProductByKeyValue(
                    "id",
                    row.idProduct
                  );
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
                  console.warn(
                    "Erreur enrichissement produit",
                    row.idProduct,
                    err
                  );
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
          setUnorderedCarts(enrichedCarts);
        } catch (err) {
          console.warn("Impossible de charger les paniers non commandés", err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={32} className="animate-spin text-sky-500 mb-4" />
        <p className="text-sm font-medium">Chargement de vos commandes...</p>
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
          to="/products"
          className="mt-4 inline-flex items-center gap-2 text-sky-500 font-medium"
        >
          <ArrowLeft size={16} /> Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes commandes</h1>
          <p className="text-slate-500 text-sm">
            {orders.length} commande{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft size={16} />
          Continuer vos achats
        </Link>
      </div>

      {/* Paniers non commandés (enrichis) */}
      {unorderedCarts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={20} />
            Paniers en cours
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Panier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Total estimé
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unorderedCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                      #{cart.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {cart.dateAdd
                        ? new Date(cart.dateAdd).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <ul className="list-disc list-inside space-y-1">
                        {cart.items.map((item, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{item.name}</span>
                            {item.reference !== "-" && (
                              <span className="text-gray-400 ml-1">
                                ({item.reference})
                              </span>
                            )}
                            <span className="text-slate-500 ml-2">
                              x{item.quantity}
                            </span>
                            <span className="text-slate-600 ml-2 font-medium">
                              {item.unitPriceTtc.toFixed(2)} € / u
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {cart.total.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Liste des commandes (inchangée) */}
      {orders.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
          <ShoppingCart size={30} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">Vous n'avez pas encore de commande.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Référence
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Total TTC
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    État
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Paiement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {order.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {order.dateAdd
                        ? new Date(order.dateAdd).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {parseFloat(order.totalPaidTaxIncl).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.stateName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {order.payment || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderList;
