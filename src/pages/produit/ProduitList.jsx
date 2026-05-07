import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Plus, Loader2, AlertCircle } from "lucide-react";
import { getAll, deleteProduct } from "../../services/produit.service";

const ProduitList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const parsed = await getAll();
      setProducts(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    setLoading(true);
    setStatus("");
    try {
      const response = await deleteProduct(id);
      if (response.ok) {
        setStatus(`✅ Produit #${id} supprimé avec succès`);
      } else {
        setStatus(`❌ Erreur ${response.status} : ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ Erreur réseau : ${error.message}`);
    } finally {
      setLoading(false);
    }
    fetchProducts();
  };

  const TypeBadge = ({ type }) => {
    const styles = {
      simple: "bg-sky-100   text-sky-700",
      combinations: "bg-amber-100 text-amber-700",
      virtual: "bg-purple-100 text-purple-700",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
          ${styles[type] ?? "bg-slate-100 text-slate-600"}`}
      >
        {type ?? "—"}
      </span>
    );
  };

  /* ── Formatage date ── */
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShoppingBag size={22} className="text-sky-500" />
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 leading-tight">
              Produits
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {products.length} produit{products.length > 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        <Link
          to="/products/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md
            bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold
            transition-colors duration-150 focus-visible:outline-2
            focus-visible:outline-sky-500 focus-visible:outline-offset-2"
        >
          <Plus size={15} strokeWidth={2.5} />
          Ajouter un produit
        </Link>
      </div>

      {/* ── État : chargement ── */}
      {loading && (
        <div
          className="flex items-center justify-center gap-3 py-24
            bg-white border border-slate-200 rounded-xl text-slate-400"
        >
          <Loader2 size={20} className="animate-spin text-sky-500" />
          <span className="text-sm font-medium">Chargement des produits…</span>
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
      {!loading && !error && products.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-3
            py-24 bg-white border border-slate-200 rounded-xl text-slate-400"
        >
          <ShoppingBag size={36} className="text-slate-300" />
          <p className="text-sm font-medium">Aucun produit trouvé.</p>
          <Link
            to="/products/create"
            className="mt-1 text-sm font-semibold text-sky-500 hover:text-sky-600
              transition-colors"
          >
            Ajouter le premier produit →
          </Link>
        </div>
      )}

      {/* ── Tableau ── */}
      {!loading && !error && products.length > 0 && (
        <div
          className="bg-white border border-slate-200 rounded-xl
            shadow-[0_1px_3px_rgba(14,165,233,0.04)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {[
                    "Référence",
                    "Type",
                    "Description",
                    "Prix",
                    "Date ajout",
                    "",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-semibold
                          uppercase tracking-wider text-slate-400"
                      aria-label={col || "Actions"}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    {/* Référence */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {product.reference || (
                        <span className="italic text-slate-300 font-normal">
                          —
                        </span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TypeBadge type={product.type} />
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                      {product.description || (
                        <span className="italic text-slate-300">—</span>
                      )}
                    </td>

                    {/* Prix */}
                    <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap font-medium">
                      {product.price != null ? (
                        `${product.price.toFixed(2)} €`
                      ) : (
                        <span className="italic text-slate-300">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                      {formatDate(product.date)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-xs font-semibold text-sky-500
                          hover:text-sky-700 transition-colors"
                      >
                        Détail
                      </Link>{" "}
                      <button
                        className="text-xs font-semibold text-red-600
                          hover:text-red-500 transition-colors"
                        onClick={() => {
                          handleDeleteProduct(product.id);
                        }}
                      >
                        Supprimer
                      </button>
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
              {products.length} produit{products.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProduitList;
