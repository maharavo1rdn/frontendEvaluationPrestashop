import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Tag,
  Info,
  Calendar,
  Package,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  CircleDollarSign,
} from "lucide-react";
import { parseProduct } from "../../XMLUtil/parser/Product.parser";

const ProduitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = `${import.meta.env.VITE_API_URL}/products/${id}`;
      const WS_KEY = import.meta.env.VITE_WS_KEY;

      const response = await fetch(`${API_URL}?output_format=XML`, {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY + ":")}`,
          Accept: "application/xml",
        },
      });

      if (!response.ok)
        throw new Error(
          `Erreur ${response.status} : Impossible de charger ce produit.`,
        );

      const xmlText = await response.text();
      const parsed = parseProduct(xmlText);
      console.log(parsed);
      setProduct(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?"))
      return;

    const API_URL = `${import.meta.env.VITE_API_URL}/products/${id}`;
    const WS_KEY = import.meta.env.VITE_WS_KEY;

    setDeleteLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "DELETE",
        headers: {
          Authorization: "Basic " + btoa(WS_KEY + ":"),
        },
      });

      if (response.ok) {
        navigate("/products"); // Retour à la liste après suppression
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (error) {
      alert("Erreur réseau.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={32} className="animate-spin text-sky-500 mb-4" />
        <p className="text-sm font-medium">
          Chargement des détails du produit...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Link
          to="/products"
          className="mt-4 inline-flex items-center gap-2 text-sky-500 font-medium"
        >
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl animate-in fade-in duration-500">
      {/* ── Navigation & Actions ── */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-500 transition-colors"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Retour à la liste
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors border border-transparent hover:border-red-100"
          >
            {deleteLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Supprimer
          </button>
          <Link
            to={`/products/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
          >
            <Edit3 size={15} />
            Modifier
          </Link>
        </div>
      </div>

      {/* ── Fiche Produit ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header de la fiche */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1 block">
                Fiche Produit #{id}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                {product?.reference || "Sans référence"}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {product?.price ? `${product.price.toFixed(2)} €` : "— €"}
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Prix de vente HT
              </p>
            </div>
          </div>
        </div>

        {/* Grille de détails */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section Gauche : Infos de base */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-sky-50 rounded-lg text-sky-500">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Type de produit
                </p>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {product?.type || "Standard"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  État du prix
                </p>
                <p className="text-sm text-slate-700 font-medium">
                  Taxes incluses : Non (HT)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Date de création
                </p>
                <p className="text-sm text-slate-700 font-medium">
                  {new Date(product?.date).toLocaleDateString("fr-FR", {
                    dateStyle: "long",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Section Droite : Description & Stock */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                <Info size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Résumé / Description
                </p>
                <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {product?.description ||
                    "Aucune description fournie pour ce produit."}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
                <Package size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Quantité en stock
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {product?.quantity ?? "Non défini"} unités
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProduitDetail;
