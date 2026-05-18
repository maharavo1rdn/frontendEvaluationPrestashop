import { useEffect, useState, useMemo } from "react";
import { getAll as getAllOrders } from "../../services/order.service";
import { getAll as getAllCategories } from "../../services/category.service";
import { getAllEnriched as getAllProducts, getProductById } from "../../services/product.service";
import { getUnorderedCarts } from "../../services/cart.service";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertCircle,
} from "lucide-react";

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
        // 1. Charger toutes les catégories
        const categories = await getAllCategories();
        const categoryMap = Object.fromEntries(
          categories.map((cat) => [cat.id, cat.name])
        );

        // 2. Charger commandes avec lignes (pour ventes)
        const orders = await getAllOrders();

        // 3. Récupérer les IDs produits vendus
        const productIdsSold = new Set();
        for (const order of orders) {
          for (const row of order.associations?.orderRows ?? []) {
            if (row.productId) productIdsSold.add(String(row.productId));
          }
        }

        // 4. Charger tous les produits
        const allProducts = await getAllProducts();
        const productMap = Object.fromEntries(
          allProducts.map((p) => [String(p.id), p])
        );

        // 5. Calculer ventes/achats par catégorie (comme avant)
        const catStats = {};
        let totalVentes = 0;
        let totalAchats = 0;
        for (const order of orders) {
          const rows = order.associations?.orderRows ?? [];
          for (const row of rows) {
            const productId = String(row.productId);
            const product = productMap[productId];
            if (!product) continue;
            const qty = Number(row.productQuantity) || 0;
            const venteHT = parseFloat(row.unitPriceTaxExcl || 0);
            const achatUnitaire = product.wholesalePrice || 0;
            const achatTotal = achatUnitaire * qty;
            const catId = product.idCategoryDefault;
            if (!catId) continue;
            if (!catStats[catId]) catStats[catId] = { ventes: 0, achats: 0 };
            catStats[catId].ventes += venteHT;
            catStats[catId].achats += achatTotal;
            totalVentes += venteHT;
            totalAchats += achatTotal;
          }
        }

        // const unorderedCarts = await getUnorderedCarts();
        const reservedByProduct = {};
        // for (const cart of unorderedCarts) {
        //   const rows = cart.associations?.cartRows ?? [];
        //   for (const row of rows) {
        //     const productId = String(row.idProduct);
        //     const qty = Number(row.quantity) || 0;
        //     reservedByProduct[productId] =
        //       (reservedByProduct[productId] || 0) + qty;
        //   }
        // }

        const physicalByCategory = {};
        for (const order of orders) {
          if ([5, 6].includes(Number(order.currentState))) continue;
          const rows = order.associations?.orderRows ?? [];
          for (const row of rows) {
            const productId = String(row.productId);
            const product = await getProductById(productId);
            const qty = Number(row.productQuantity) || 0;
            reservedByProduct[productId] =
              (reservedByProduct[productId] || 0) + qty;
            physicalByCategory[product.idCategoryDefault] = (physicalByCategory[product.idCategoryDefault] || 0) + qty; 
          }
        }

        // 7. Calculer les quantités physiques par catégorie
        for (const product of allProducts) {
          const catId = product.idCategoryDefault;
          if (!catId) continue;

          const stock = product.stockQuantity ?? 0;
          physicalByCategory[catId] = (physicalByCategory[catId] || 0) + stock;
        }

        // 8. Calculer les réservations par catégorie
        const reservedByCategory = {};
        for (const [productId, qty] of Object.entries(reservedByProduct)) {
          const product = productMap[productId];
          if (!product) continue;
          const catId = product.idCategoryDefault;
          if (!catId) continue;
          reservedByCategory[catId] = (reservedByCategory[catId] || 0) + qty;
        }

        // 9. Construire le tableau des catégories de stock
        const stockCatArray = Object.keys(physicalByCategory)
          .map((catId) => ({
            id: catId,
            name: categoryMap[catId] || `Catégorie ${catId}`,
            qtePhysique: physicalByCategory[catId] || 0,
            qteReservee: reservedByCategory[catId] || 0,
            qteDisponible:
              (physicalByCategory[catId] || 0) -
              (reservedByCategory[catId] || 0),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        // 10. Finaliser les stats de ventes
        const catArray = Object.entries(catStats)
          .map(([id, values]) => ({
            id,
            name: categoryMap[id] || `Catégorie ${id}`,
            ventes: values.ventes,
            achats: values.achats,
            benefice: values.ventes - values.achats,
            marge:
              values.ventes > 0
                ? ((values.ventes - values.achats) / values.ventes) * 100
                : 0,
          }))
          .sort((a, b) => b.benefice - a.benefice);

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
