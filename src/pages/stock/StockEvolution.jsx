import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Clock,
  User,
} from "lucide-react";
import { findStockAvailablesByProductId } from "../../services/stockAvailable.service";
import { findStockMovementsByStockAvailables } from "../../services/stockMovement.service";
import { getProductById } from "../../services/product.service";
import { findCombinationsByProductId } from "../../services/combination.service";
import { findProductOptionValueByKeyValue } from "../../services/productOptionValue.service";

const buildStockLabelMap = async (stocks, productId) => {
  const map = {};

  const combinations = await findCombinationsByProductId(productId).catch(() => []);

  for (const stock of stocks) {
    const idProductAttribute = stock.idProductAttribute;

    if (!idProductAttribute || String(idProductAttribute) === "0") {
      map[stock.id] = null;
      continue;
    }

    const combination = combinations.find(
      (c) => String(c.id) === String(idProductAttribute)
    );

    if (!combination) {
      map[stock.id] = `Combinaison #${idProductAttribute}`;
      continue;
    }

    const optionValueIds = combination?.associations?.productOptionValues ?? [];
    if (!optionValueIds.length) {
      map[stock.id] = `Combinaison #${combination.id}`;
      continue;
    }

    const names = await Promise.all(
      optionValueIds.map(async (valueId) => {
        const results = await findProductOptionValueByKeyValue("id", valueId).catch(() => []);
        return results?.[0]?.name ?? "";
      })
    );

    map[stock.id] = names.filter(Boolean).join(" / ");
  }

  return map;
};

const StockEvolution = () => {
  const { productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ product: null, movements: [], stockLabelMap: {} });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [product, stocks] = await Promise.all([
          getProductById(productId),
          findStockAvailablesByProductId(productId),
        ]);

        const [movements, stockLabelMap] = await Promise.all([
          findStockMovementsByStockAvailables(stocks),
          buildStockLabelMap(stocks, productId),
        ]);

        setData({ product, movements, stockLabelMap });
      } catch (error) {
        console.error("Erreur lors du chargement :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const groupedMovements = useMemo(() => {
    const groups = {};

    data.movements.forEach((mvt) => {
      const date = mvt.dateAdd.split(" ")[0];
      if (!groups[date]) {
        groups[date] = { date, movements: [], totalIn: 0, totalOut: 0 };
      }
      groups[date].movements.push(mvt);
      if (mvt.sign === 1) {
        groups[date].totalIn += mvt.physicalQuantity;
      } else {
        groups[date].totalOut += mvt.physicalQuantity;
      }
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [data.movements]);

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500">
        Chargement de l'historique détaillé...
      </div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        to="/backOffice/stocks"
        className="flex items-center gap-2 text-slate-500 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Retour aux stocks
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Historique des mouvements
        </h1>
        <p className="text-slate-500">
          Produit :{" "}
          <span className="font-semibold text-slate-700">
            {data.product?.name}
          </span>{" "}
          (Réf: {data.product?.reference})
        </p>
      </div>

      {groupedMovements.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-slate-200">
          <Package size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="text-slate-400">Aucun mouvement de stock enregistré.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedMovements.map((group) => (
            <div key={group.date} className="relative">
              {/* Entête du jour */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 bg-slate-100/50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Clock size={18} className="text-slate-400" />
                  </div>
                  <h2 className="font-bold text-slate-700 text-lg">
                    {new Date(group.date).toLocaleDateString("fr-FR", {
                      dateStyle: "full",
                    })}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Entrées</p>
                    <p className="text-emerald-600 font-bold">+{group.totalIn}</p>
                  </div>
                  <div className="border-r border-slate-200" />
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Sorties</p>
                    <p className="text-rose-600 font-bold">-{group.totalOut}</p>
                  </div>
                </div>
              </div>

              {/* Tableau des opérations */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ml-0 sm:ml-4">
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-left">Heure</th>
                        <th className="px-6 py-3 font-semibold text-left">Combinaison</th>
                        <th className="px-6 py-3 font-semibold text-left">Détails / Raison</th>
                        <th className="px-6 py-3 font-semibold text-center">Employé</th>
                        <th className="px-6 py-3 font-semibold text-right">Quantité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.movements.map((mvt) => {
                        const combinationLabel = data.stockLabelMap[mvt.idStock];
                        return (
                          <tr key={mvt.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 text-slate-400 font-medium">
                              {mvt.dateAdd.split(" ")[1]}
                            </td>
                            <td className="px-6 py-4">
                              {combinationLabel ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                                  {combinationLabel}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Simple</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-slate-700 font-medium">
                                  ID Mouvement: #{mvt.id}
                                </span>
                                <span className="text-xs text-slate-400 italic">
                                  Raison ID: {mvt.idReason}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-slate-600 border border-slate-100">
                                <User size={12} />
                                <span>ID: {mvt.idEmployee}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`font-bold px-3 py-1 rounded-lg ${
                                  mvt.sign === 1
                                    ? "text-emerald-600 bg-emerald-50"
                                    : "text-rose-600 bg-rose-50"
                                }`}
                              >
                                {mvt.sign === 1 ? "+" : "-"}
                                {mvt.physicalQuantity}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockEvolution;