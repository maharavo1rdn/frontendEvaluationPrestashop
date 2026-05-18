import { useEffect, useState } from "react";
import { getAll as getAllOrders } from "../../services/order.service";
import { getAll as getAllCategories } from "../../services/category.service";
import { getAllEnriched as getAllProducts } from "../../services/product.service";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertCircle,
} from "lucide-react";
import { findStockAvailableByProductAttribute } from "../../services/stockAvailable.service";
import { findStockMovementsByStockAvailables } from "../../services/stockMovement.service";

const StatsVentes = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [stockCategories, setStockCategories] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Catégories
        const categories = await getAllCategories();
        const categoryMap = Object.fromEntries(
          categories.map((cat) => [cat.id, cat.name])
        );

        // 2. Commandes + tous les produits
        const orders = await getAllOrders();
        const allProducts = await getAllProducts();
        const productMap = Object.fromEntries(
          allProducts.map((p) => [String(p.id), p])
        );

        const achatsByCategory = {};

        const stockPairs = [];
        for (const product of allProducts) {
          const productId = String(product.id);
          const comboIds = product.associations?.combinations ?? [];
          if (comboIds.length > 0) {
            for (const comboId of comboIds) {
              stockPairs.push({
                productId,
                productAttributeId: String(comboId),
              });
            }
          } else {
            stockPairs.push({ productId, productAttributeId: "0" });
          }
        }

        for (const { productId, productAttributeId } of stockPairs) {
          const product = productMap[productId];
          if (!product) continue;
          const catId = product.idCategoryDefault;
          if (!catId) continue;
          const wholesalePrice = Number(product.wholesalePrice ?? 0);

          const stockAvailables = await findStockAvailableByProductAttribute(
            productId,
            productAttributeId
          );
          const movements = await findStockMovementsByStockAvailables(
            stockAvailables
          );

          const supplyMovements = movements.filter(
            (m) => Number(m.idStockMvtReason) === 1
          );

          const totalQtySupplied = supplyMovements.reduce(
            (sum, m) => sum + (Number(m.physicalQuantity) || 0),
            0
          );

          const montantAchat = wholesalePrice * totalQtySupplied;

          achatsByCategory[catId] =
            (achatsByCategory[catId] ?? 0) + montantAchat;
        }

        const ventesByCategory = {};
        let totalVentes = 0;

        for (const order of orders) {
          if (Number(order.valid) !== 1) continue;
          for (const row of order.associations?.orderRows ?? []) {
            const productId = String(row.productId);
            const product = productMap[productId];
            if (!product) continue;
            const catId = product.idCategoryDefault;
            if (!catId) continue;

            const qty = Number(row.productQuantity) || 0;
            const venteUnitaireHT = Number(row.unitPriceTaxExcl ?? 0);
            const venteHT = venteUnitaireHT * qty;

            ventesByCategory[catId] = (ventesByCategory[catId] ?? 0) + venteHT;
            totalVentes += venteHT;
          }
        }

        // ── Totaux globaux ────────────────────────────────────────────────────
        const totalAchats = Object.values(achatsByCategory).reduce(
          (sum, v) => sum + v,
          0
        );

        // ── Tableau par catégorie (ventes + achats) ───────────────────────────
        const allCatIds = new Set([
          ...Object.keys(ventesByCategory),
          ...Object.keys(achatsByCategory),
        ]);

        const catArray = Array.from(allCatIds)
          .map((catId) => {
            const ventes = ventesByCategory[catId] ?? 0;
            const achats = achatsByCategory[catId] ?? 0;
            const benefice = ventes - achats;
            return {
              id: catId,
              name: categoryMap[catId] ?? `Catégorie ${catId}`,
              ventes,
              achats,
              benefice,
              marge: ventes > 0 ? (benefice / ventes) * 100 : 0,
            };
          })
          .sort((a, b) => b.benefice - a.benefice);

        // ── Stock par catégorie ───────────────────────────────────────────────

        // Stock physique = stockQuantity remontée directement par l'API produit.
        // C'est déjà le stock réel en entrepôt, on ne touche à rien d'autre.
        const physicalByCategory = {};
        for (const product of allProducts) {
          const catId = product.idCategoryDefault;
          if (!catId) continue;
          physicalByCategory[catId] =
            (physicalByCategory[catId] ?? 0) + (product.stockQuantity ?? 0);
        }

        // Stock réservé = commandes en cours (hors états livrée=5 et annulée=6).
        // Ces quantités sont "bloquées" : commandées mais pas encore expédiées.
        const ETATS_TERMINES = new Set([5, 6]);
        const reservedByCategory = {};
        for (const order of orders) {
          if (ETATS_TERMINES.has(Number(order.currentState))) continue;
          for (const row of order.associations?.orderRows ?? []) {
            const product = productMap[String(row.productId)];
            if (!product) continue;
            const catId = product.idCategoryDefault;
            if (!catId) continue;
            const qty = Number(row.productQuantity) || 0;
            reservedByCategory[catId] = (reservedByCategory[catId] ?? 0) + qty;
            physicalByCategory[catId] += qty;
          }
        }

        const stockCatArray = Object.keys(physicalByCategory)
          .map((catId) => ({
            id: catId,
            name: categoryMap[catId] ?? `Catégorie ${catId}`,
            qtePhysique: physicalByCategory[catId] ?? 0,
            qteReservee: reservedByCategory[catId] ?? 0,
            qteDisponible:
              (physicalByCategory[catId] ?? 0) -
              (reservedByCategory[catId] ?? 0),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setStats({
          global: {
            ventes: totalVentes,
            achats: totalAchats,
            benefice: totalVentes - totalAchats,
          },
          categories: catArray,
        });
        setStockCategories(stockCatArray);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-gray-400">
        <Loader2 size={32} className="animate-spin" />
        <span className="ml-3">Calcul des statistiques...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-4 text-gray-500">Aucune donnée disponible.</div>;
  }

  const { global, categories } = stats;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Statistiques</h1>

      {/* Résumé global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <DollarSign size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Ventes (HT)</p>
            <p className="text-2xl font-bold text-gray-900">
              {global.ventes.toFixed(2)} €
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <ShoppingBag size={24} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Achats</p>
            <p className="text-2xl font-bold text-gray-900">
              {global.achats.toFixed(2)} €
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <TrendingUp size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bénéfice</p>
            <p className="text-2xl font-bold text-gray-900">
              {global.benefice.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Bénéfice par catégorie */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Bénéfice par catégorie
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ventes (HT)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Achats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Bénéfice
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Marge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {cat.ventes.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {cat.achats.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span
                          className={
                            cat.benefice >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {cat.benefice.toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {cat.marge.toFixed(1)} %
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Aucune donnée disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stock par catégorie */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package size={20} />
            Stock par catégorie
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qté physique
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qté réservée
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qté disponible
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockCategories.length > 0 ? (
                  stockCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {cat.qtePhysique}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {cat.qteReservee}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span
                          className={
                            cat.qteDisponible >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {cat.qteDisponible}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Aucune donnée de stock disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatsVentes;
