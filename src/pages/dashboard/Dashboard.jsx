import React, { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/stats.service";
import {
  TrendingUp,
  ShoppingBag,
  Wallet,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-sky-600" />
        <p className="font-medium text-lg">Chargement des données en cours...</p>
      </div>
    );

  if (error)
    return (
      <div className="m-6 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
        <AlertCircle />
        <p className="font-medium">
          Erreur lors de la récupération des données : {error}
        </p>
      </div>
    );

  const formatPrice = (val) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(val);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Tableau de Bord
        </h1>
        <p className="text-slate-500 mt-1">
          Analyse des ventes et des encaissements réeels
        </p>
      </div>

      {/* i. Total Général (Cartes de Synthèse) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CA Commandé */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            CA Commandé
          </h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatPrice(stats.globalTotalOrdered)}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <Clock size={12} className="mr-1" /> Total des commandes passées
          </div>
        </div>

        {/* CA Encaissé (Reçu) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-emerald-500/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet size={24} />
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
              Réel
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            CA Encaissé
          </h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatPrice(stats.globalTotalReceived)}
          </p>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <CheckCircle2 size={12} className="mr-1" /> Montant réellement perçu
          </div>
        </div>

        {/* Nombre de Commandes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            Commandes
          </h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.totalOrdersCount}
          </p>
        </div>

      </div>

      {/* ii. Par jour (Tableau détaillé) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-400" size={20} />
            <h2 className="font-bold text-slate-800">
              Détail des activités quotidiennes
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Vol.</th>
                <th className="px-6 py-4 font-bold text-right">CA Commandé</th>
                <th className="px-6 py-4 font-bold text-right text-emerald-700">
                  CA Encaissé
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.daily.map((day) => (
                <tr
                  key={day.date}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700 uppercase">
                    {new Date(day.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">
                      {day.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                    {formatPrice(day.ordered)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                    {formatPrice(day.received)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.daily.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Aucune donnée enregistrée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
