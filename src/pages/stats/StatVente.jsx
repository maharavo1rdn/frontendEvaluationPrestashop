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
        const [orders, allProducts] = await Promise.all([
          getAllOrders(),
          getAllProducts(),
        ]);
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

        // ── Achats basés sur les mouvements de stock (reason = 1) ─────
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

        // ── Ventes et achats réels (depuis les commandes) ────────────
        const ventesByCategory = {};
        const achatReelByCategory = {};
        let totalVentes = 0;
        let totalAchatsReel = 0;

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
            const achatReel = Number(product.wholesalePrice ?? 0) * qty;

            ventesByCategory[catId] = (ventesByCategory[catId] ?? 0) + venteHT;
            achatReelByCategory[catId] =
              (achatReelByCategory[catId] ?? 0) + achatReel;
            totalVentes += venteHT;
            totalAchatsReel += achatReel;
          }
        }

        // ── Totaux globaux ──────────────────────────────────────────
        const totalAchats = Object.values(achatsByCategory).reduce(
          (sum, v) => sum + v,
          0
        );

        // ── Tableau par catégorie ──────────────────────────────────
        const allCatIds = new Set([
          ...Object.keys(ventesByCategory),
          ...Object.keys(achatsByCategory),
        ]);

        const catArray = Array.from(allCatIds)
          .map((catId) => {
            const ventes = ventesByCategory[catId] ?? 0;
            const achatOrder = achatReelByCategory[catId] ?? 0;
            const achats = achatsByCategory[catId] ?? 0;
            const beneficeMvt = ventes - achats;
            const beneficeCmd = ventes - achatOrder;
            return {
              id: catId,
              name: categoryMap[catId] ?? `Catégorie ${catId}`,
              ventes,
              achats,
              achatOrder,
              beneficeMvt,
              beneficeCmd,
              marge: ventes > 0 ? (beneficeMvt / ventes) * 100 : 0,
            };
          })
          .sort((a, b) => b.beneficeMvt - a.beneficeMvt);

        // ── Stock par catégorie ────────────────────────────────────
        const ETATS_TERMINES = new Set([5, 6]);
        const reservedByCategory = {};
        const physicalByCategory = {};

        for (const product of allProducts) {
          const catId = product.idCategoryDefault;
          if (!catId) continue;
          physicalByCategory[catId] =
            (physicalByCategory[catId] ?? 0) + (product.stockQuantity ?? 0);
        }

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
            achatReel: totalAchatsReel,
            benefice: totalVentes - totalAchats,
            beneficeCmd: totalVentes - totalAchatsReel,
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

  const formatCurrency = (val) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(val ?? 0);

  const formatNumber = (val) => new Intl.NumberFormat("fr-FR").format(val ?? 0);

  const formatPercent = (val) =>
    `${new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(val ?? 0)} %`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Statistiques</h1>

      {/* Résumé global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <DollarSign size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Ventes (HT)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(global.ventes)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <ShoppingBag size={24} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Achats (mvt)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(global.achats)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <ShoppingBag size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Achats commandes</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(global.achatReel)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <TrendingUp size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bénéfice (mvt)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(global.benefice)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-full">
            <TrendingUp size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bénéfice (cmd)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(global.beneficeCmd)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Bénéfice par catégorie – tableau responsive */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Bénéfice par catégorie
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="min-w-[700px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Catégorie
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ventes (HT)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Achats (mvt)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Achats (cmd)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Bénéfice (mvt)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Bénéfice (cmd)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Marge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {formatCurrency(cat.ventes)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {formatCurrency(cat.achats)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {formatCurrency(cat.achatOrder)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span
                          className={
                            cat.beneficeMvt >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(cat.beneficeMvt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span
                          className={
                            cat.beneficeCmd >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(cat.beneficeCmd)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatPercent(cat.marge)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
            <div className="overflow-x-auto">
              <table className="min-w-[520px] w-full divide-y divide-gray-200">
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
                          {formatNumber(cat.qtePhysique)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatNumber(cat.qteReservee)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          <span
                            className={
                              cat.qteDisponible >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {formatNumber(cat.qteDisponible)}
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatsVentes;
