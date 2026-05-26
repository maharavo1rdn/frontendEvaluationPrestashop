import { useEffect, useState } from "react";
import { getAll as getAllCategories } from "../../services/category.service";
import { removeStock } from "../../services/stockAvailable.service";
import { useAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";

const RemoveStock = () => {
  const { isAdminAuthenticated } = useAuth();
  if (!isAdminAuthenticated) {
    sessionStorage.setItem("removeStockCustomer", true);
    return <Navigate to="/backoffice" replace />;
  }

  // États individuels pour chaque champ
  const [nombre, setNombre] = useState(1);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [recap, setRecap] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);
  const loadCategories = async () => {
    try {
      setCategories(await getAllCategories());
    } catch (err) {
      console.warn("Impossible de charger les catégories", err);
    }
  };

  const handleSubmit = async () => {
    const result = await removeStock(categoryFilter, nombre);
    setRecap(result);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };
  return (
    <>
      {/* ===== Formulaire ===== */}
      <form className="max-w-2xl mx-auto bg-white p-8 border border-slate-200 rounded-xl shadow-sm space-y-6">
        {/* Nom */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">Nombre</label>
          <input
            type="number"
            number={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Entrer la quantité à diminuer"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">
            Catégorie
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="">Toutes</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {"—".repeat(cat.levelDepth)} {cat.name || `ID ${cat.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Boutons du formulaire */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              handleSubmit();
            }}
            className="flex-1 py-3 px-4 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors"
          >
            Valider
          </button>
        </div>
      </form>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Récapitulatif
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-600">Total :</span>{" "}
                {recap.affected || (
                  <span className="text-slate-400">Non renseigné</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-600">Réalisé :</span>{" "}
                {recap.realeased || (
                  <span className="text-slate-400">Non renseignée</span>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RemoveStock;
