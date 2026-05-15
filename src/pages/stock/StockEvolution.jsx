import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  User,
  Hash,
} from "lucide-react";
import { findStockAvailablesByProductId } from "../../services/stockAvailable.service";
import { findStockMovementsByStockAvailables } from "../../services/stockMovement.service";
import { getProductById } from "../../services/product.service";

const StockEvolution = () => {
  const { productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ product: null, movements: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [product, stocks] = await Promise.all([
          getProductById(productId),
          findStockAvailablesByProductId(productId),
        ]);

        const movements = await findStockMovementsByStockAvailables(stocks);
        setData({ product, movements });
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
        groups[date] = {
          date: date,
          movements: [],
          totalIn: 0,
          totalOut: 0,
        };
      }

      groups[date].movements.push(mvt);

      if (mvt.sign === 1) {
        groups[date].totalIn += mvt.quantity;
      } else {
        groups[date].totalOut += mvt.quantity;
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
              {/* Entête du jour avec Recap */}
              <div className="flex items-center justify-between mb-4 bg-slate-100/50 p-4 rounded-xl border border-slate-100">
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

                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Total Entrées
                    </p>
                    <p className="text-emerald-600 font-bold">
                      +{group.totalIn}
                    </p>
                  </div>
                  <div className="border-r border-slate-200"></div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Total Sorties
                    </p>
                    <p className="text-rose-600 font-bold">-{group.totalOut}</p>
                  </div>
                </div>
              </div>

              {/* Tableau des opérations détaillées pour ce jour */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ml-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-left">
                        Heure
                      </th>
                      <th className="px-6 py-3 font-semibold text-left">
                        Détails / Raison
                      </th>
                      <th className="px-6 py-3 font-semibold text-center">
                        Employé
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Quantité
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.movements.map((mvt) => (
                      <tr
                        key={mvt.id}
                        className="hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {mvt.dateAdd.split(" ")[1]}
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
                            {mvt.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockEvolution;
