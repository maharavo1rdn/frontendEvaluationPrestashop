import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Plus, Loader2, AlertCircle } from "lucide-react";

const ClientList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const estRoleMajeur = (level) => {
    return level > 5 ? "green" : "red";
  };
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = `${import.meta.env.VITE_API_URL}/roles`;
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Erreur lors du chargement des rôles.");
      const result = await response.json();
      setRoles(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Badge de niveau */
  const LevelBadge = ({ level }) => {
    const styles = {
      1: "bg-slate-100 text-slate-600",
      2: "bg-sky-100 text-sky-700",
      3: "bg-amber-100 text-amber-700",
      4: "bg-red-100 text-red-600",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
          ${styles[level] ?? "bg-slate-100 text-slate-600"}`}
      >
        Niveau {level}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-sky-500" />
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 leading-tight">
              Rôles
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {roles.length} rôle{roles.length > 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        <Link
          to="/roles/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md
            bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold
            transition-colors duration-150 focus-visible:outline-2
            focus-visible:outline-sky-500 focus-visible:outline-offset-2"
        >
          <Plus size={15} strokeWidth={2.5} />
          Créer un rôle
        </Link>
      </div>

      {/* ── État : chargement ── */}
      {loading && (
        <div
          className="flex items-center justify-center gap-3 py-24
          bg-white border border-slate-200 rounded-xl text-slate-400"
        >
          <Loader2 size={20} className="animate-spin text-sky-500" />
          <span className="text-sm font-medium">Chargement des rôles…</span>
        </div>
      )}

      {/* ── État : erreur ── */}
      {!loading && error && (
        <div
          className="flex items-center gap-3 px-5 py-4 bg-red-50
          border border-red-200 rounded-xl text-red-600 text-sm font-medium"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* ── État : liste vide ── */}
      {!loading && !error && roles.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-3
          py-24 bg-white border border-slate-200 rounded-xl text-slate-400"
        >
          <ShieldCheck size={36} className="text-slate-300" />
          <p className="text-sm font-medium">Aucun rôle trouvé.</p>
          <Link
            to="/roles/create"
            className="mt-1 text-sm font-semibold text-sky-500 hover:text-sky-600
              transition-colors"
          >
            Créer le premier rôle →
          </Link>
        </div>
      )}

      {/* ── Tableau ── */}
      {!loading && !error && roles.length > 0 && (
        <div
          className="bg-white border border-slate-200 rounded-xl
          shadow-[0_1px_3px_rgba(14,165,233,0.04)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold
                    uppercase tracking-wider text-slate-400" 
                  >
                    Nom
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold
                    uppercase tracking-wider text-slate-400"
                  >
                    Niveau
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold
                    uppercase tracking-wider text-slate-400"
                  >
                    Description
                  </th>
                  <th className="px-5 py-3" aria-label="Actions" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    {/* Nom */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap" style={{color:estRoleMajeur(role.level)}}>
                      {role.name}
                    </td>

                    {/* Niveau */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <LevelBadge level={role.level} />
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                      {role.description || (
                        <span className="italic text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/roles/${role.id}/edit`}
                        className="text-xs font-semibold text-sky-500
                          hover:text-sky-700 transition-colors"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer du tableau */}
          <div
            className="px-5 py-3 border-t border-slate-100 bg-slate-50
            flex items-center justify-between"
          >
            <p className="text-xs text-slate-400">
              {roles.length} rôle{roles.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
