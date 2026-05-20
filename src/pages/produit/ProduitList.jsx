import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Loader2,
  AlertCircle,
  Search,
  RotateCcw,
} from "lucide-react";
import { getAllEnriched, searchProductsEnriched } from "../../services/product.service";
import { getAll as getAllCategories } from "../../services/category.service";
import {
  addCartItem,
  getCart,
  getCartTotals,
} from "../../services/frontoffice/cartStore.service";
import {
  computePriceWithTax,
  getTaxRateForGroup,
} from "../../services/frontoffice/pricing.service";
import ProductCard from "./ProductCard";

const ProduitList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardStatus, setCardStatus] = useState({});
  const [isSearching, setIsSearching] = useState(false);

  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [cartCount, setCartCount] = useState(0);

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
      setProducts(await getAllEnriched());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(await getAllCategories());
    } catch (err) {
      console.warn("Impossible de charger les catégories", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsSearching(true);
    try {
      setProducts(await searchProductsEnriched({
        name: nameFilter,
        categoryId: categoryFilter || undefined,
        minPrice: minPrice !== "" ? minPrice : undefined,
        maxPrice: maxPrice !== "" ? maxPrice : undefined,
      }));
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

  const handleAddToCart = useCallback(async (product, selectedCombo) => {
    if (product.stockQuantity !== null && product.stockQuantity <= 0) {
      setCardStatus((prev) => ({ ...prev, [product.id]: "Stock insuffisant." }));
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
        idProductAttribute: selectedCombo?.id ?? "0",
        combinationLabel: selectedCombo?.label ?? "",
        taxRate,
      });
      setCardStatus((prev) => ({ ...prev, [product.id]: "Ajouté ✓" }));
      setTimeout(
        () => setCardStatus((prev) => ({ ...prev, [product.id]: "" })),
        2000
      );
    } catch {
      setCardStatus((prev) => ({ ...prev, [product.id]: "Erreur panier." }));
    }
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue</h1>
          <p className="text-slate-500 text-sm">
            {isSearching ? "Résultats de recherche" : "PrestaShop"} —{" "}
            {products.length} article{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/frontOffice/cart"
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50"
        >
          <ShoppingBag size={16} />
          Panier ({cartCount})
        </Link>
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
            <label className="text-xs font-semibold text-slate-600">Catégorie</label>
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
            <label className="text-xs font-semibold text-slate-600">Prix min</label>
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
            <label className="text-xs font-semibold text-slate-600">Prix max</label>
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

      {/* Contenu */}
      {loading && products.length === 0 ? (
        <div className="py-24 text-center bg-white border border-slate-200 rounded-xl">
          <Loader2 size={30} className="mx-auto mb-3 text-slate-300 animate-spin" />
          <p className="text-slate-400 text-sm">Chargement du catalogue...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm">Aucun produit trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              status={cardStatus[product.id] ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProduitList;