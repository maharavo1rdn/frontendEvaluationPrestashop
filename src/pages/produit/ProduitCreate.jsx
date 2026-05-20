import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PackagePlus, ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { buildProductXML } from "../../XMLUtil/builder/Product.builder";

const ProduitCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    reference: "",
    price: "",
    description: "",
    active: true,
    type: "simple",
    categoryId: 2,
    taxRulesGroupId: 1
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const API_URL = `${import.meta.env.VITE_API_URL}/products`;
      const WS_KEY = import.meta.env.VITE_WS_KEY;

      const productData = {
        ...form,
        price: parseFloat(form.price) || 0,
      };
      const xmlPayload = buildProductXML(productData);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(WS_KEY + ":")}`,
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xmlPayload,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Détails erreur XML:", errorText);
        throw new Error(`Erreur ${res.status} : Impossible de créer le produit.`);
      }

      // Succès : retour à la liste
      navigate("/products");
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl animate-in fade-in duration-500">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-lg text-white">
            <PackagePlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nouveau Produit</h1>
            <p className="text-sm text-slate-500">Ajouter un article au catalogue PrestaShop</p>
          </div>
        </div>
        <Link to="/products" className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft size={16} /> Annuler
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* ── Formulaire ── */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nom du produit *</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="ex: T-shirt en coton bio"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
            </div>

            {/* Référence */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Référence (SKU)</label>
              <input
                name="reference"
                value={form.reference}
                onChange={handleChange}
                placeholder="ex: TSH-001"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
            </div>

            {/* Prix */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Prix HT (€) *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Description courte</label>
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              placeholder="Décrivez brièvement le produit..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Produit actif</span>
              <span className="text-xs text-slate-500">Rendre le produit visible immédiatement</span>
            </div>
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleChange}
              className="w-5 h-5 accent-sky-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Création..." : "Enregistrer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProduitCreate;