import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Plus,
  Loader2,
  AlertCircle,
  Flame,
  Sparkles,
  Search,
  RotateCcw,
} from "lucide-react";
import { getAll, searchProducts } from "../../services/product.service";
import { getAll as getAllCategories } from "../../services/category.service";
import { getStockAvailableById } from "../../services/stockAvailable.service";
import {
  addCartItem,
  getCart,
  getCartTotals,
} from "../../services/frontoffice/cartStore.service";
import {
  computePriceWithTax,
  getTaxRateForGroup,
} from "../../services/frontoffice/pricing.service";

const ProduitList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isSearching, setIsSearching] = useState(false); // indique si on a fait une recherche

  // Panier
  const [cartCount, setCartCount] = useState(0);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  useEffect(() => {
    loadAllProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    const cart = getCart();
    setCartCount(getCartTotals(cart).totalQuantity);
    const handleUpdate = (event) => {
      const nextCart = event.detail ?? getCart();
      setCartCount(getCartTotals(nextCart).totalQuantity);
    };
    window.addEventListener("cart:updated", handleUpdate);
    return () => window.removeEventListener("cart:updated", handleUpdate);
  }, []);

  const loadAllProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAll();
      setProducts(await enrichWithStock(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (err) {
      console.warn("Impossible de charger les catégories", err);
    }
  };

  // Enrichissement avec le stock (comme avant)
  const enrichWithStock = async (productsArray) => {
    return Promise.all(
      productsArray.map(async (product) => {
        const stockId = product?.associations?.stockAvailables?.[0]?.id;
        if (!stockId) return { ...product, stockQuantity: null };
        try {
          const stock = await getStockAvailableById(stockId);
          return { ...product, stockQuantity: stock?.quantity ?? null };
        } catch {
          return { ...product, stockQuantity: null };
        }
      })
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsSearching(true);
    try {
      const filters = {
        name: nameFilter,
        categoryId: categoryFilter || undefined,
        minPrice: minPrice !== "" ? minPrice : undefined,
        maxPrice: maxPrice !== "" ? maxPrice : undefined,
      };
      const results = await searchProducts(filters);
      setProducts(await enrichWithStock(results));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNameFilter("");
    setCategoryFilter("");
    setMinPrice("");
    setMaxPrice("");
    setIsSearching(false);
    loadAllProducts();
  };

  const getFreshnessBadge = (product) => {
    if (!product.dateAvailable) return null;
    const availableDate = new Date(product.dateAvailable);
    availableDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - availableDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 border border-orange-200">
          <Flame size={12} /> HOT
        </span>
      );
    }
    if (diffDays > 1 && diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
          <Sparkles size={12} /> NEW
        </span>
      );
    }
    return null;
  };

  const TypeBadge = ({ type }) => {
    const styles = {
      simple: "bg-sky-100 text-sky-700",
      combinations: "bg-amber-100 text-amber-700",
      virtual: "bg-purple-100 text-purple-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
          styles[type] ?? "bg-slate-100 text-slate-600"
        }`}
      >
        {type || "simple"}
      </span>
    );
  };

  const handleAddToCart = async (product) => {
    if (product.stockQuantity !== null && product.stockQuantity <= 0) {
      setStatus("Stock insuffisant pour ajouter ce produit.");
      return;
    }
    try {
      const taxRate = await getTaxRateForGroup(product.idTaxRulesGroup);
      const priceTaxIncl = computePriceWithTax(product.price, taxRate);
      addCartItem({
        id: product.id,
        name: product.name,
        price: product.price,
        priceTaxIncl,
        reference: product.reference,
        stockQuantity: product.stockQuantity,
        idTaxRulesGroup: product.idTaxRulesGroup,
        taxRate,
      });
      setStatus(`Produit ajouté au panier : ${product.name || "Produit"}.`);
    } catch {
      setStatus("Impossible d'ajouter ce produit au panier.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestion des Produits
          </h1>
          <p className="text-slate-500 text-sm">
            {isSearching ? "Résultats de la recherche" : "Catalogue PrestaShop"}{" "}
            — {products.length} article{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/frontOffice/cart"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg"
          >
            <ShoppingBag size={16} />
            Panier ({cartCount})
          </Link>
        </div>
      </div>

      {/* Barre de recherche */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Nom</label>
            <input
              type="text"
              placeholder="Recherche..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Prix min
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Prix max
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="999.99"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 h-10 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-sm transition-all"
            >
              <Search size={16} />
              Rechercher
            </button>
            {isSearching && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-1 h-10 px-3 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                title="Réinitialiser"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Messages */}
      {status && (
        <div className="mb-6 p-4 bg-slate-100 border-l-4 border-slate-500 text-slate-700 text-sm font-bold">
          {status}
        </div>
      )}

      {/* Tableau */}
      {loading && products.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
          <Loader2
            size={30}
            className="mx-auto mb-3 text-slate-300 animate-spin"
          />
          <p className="text-slate-400">Chargement des données...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[15%]">
                    Référence
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[22%]">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[10%]">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[10%]">
                    Marque
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[10%]">
                    Prix HT
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[10%]">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[10%] text-center">
                    Actif
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[13%] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      {product.reference || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {product.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={product.type} />
                    </td>
                    <td className="px-6 py-4">{getFreshnessBadge(product)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {product.price
                        ? `${Number(product.price).toFixed(2)} €`
                        : "0.00 €"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {product.stockQuantity ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                          product.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.active ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`/frontOffice/products/${product.id}`}
                          className="text-xs font-bold text-sky-600 hover:underline"
                        >
                          Voir
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          Ajouter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Aucun produit trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProduitList;
