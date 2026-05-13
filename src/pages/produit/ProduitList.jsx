import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Plus, Loader2, AlertCircle } from "lucide-react";
import { getAll } from "../../services/product.service";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchProducts();
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const parsed = await getAll();
      const withStock = await Promise.all(
        parsed.map(async (product) => {
          const stockId = product?.associations?.stockAvailables?.[0]?.id;
          if (!stockId) {
            return { ...product, stockQuantity: null };
          }
          try {
            const stock = await getStockAvailableById(stockId);
            return { ...product, stockQuantity: stock?.quantity ?? null };
          } catch (stockError) {
            return { ...product, stockQuantity: null };
          }
        })
      );
      setProducts(withStock);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const TypeBadge = ({ type }) => {
    const styles = {
      simple: "bg-sky-100 text-sky-700",
      combinations: "bg-amber-100 text-amber-700",
      virtual: "bg-purple-100 text-purple-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${styles[type] ?? "bg-slate-100 text-slate-600"}`}
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
      setStatus(`Produit ajoute au panier : ${product.name || "Produit"}.`);
    } catch (err) {
      setStatus("Impossible d'ajouter ce produit au panier.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestion des Produits
          </h1>
          <p className="text-slate-500 text-sm">
            Catalogue PrestaShop — {products.length} articles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg"
          >
            <ShoppingBag size={16} />
            Panier ({cartCount})
          </Link>
          <Link
            to="/products/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-lg"
          >
            <Plus size={16} />
            Ajouter un produit
          </Link>
        </div>
      </div>

      {status && (
        <div className="mb-6 p-4 bg-slate-100 border-l-4 border-slate-500 text-slate-700 text-sm font-bold">
          {status}
        </div>
      )}

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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[25%]">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[12%]">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[12%]">
                    Prix HT
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[12%]">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[12%] text-center">
                    Actif
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-[12%] text-right">
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
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {product.price ? `${Number(product.price).toFixed(2)} €` : "0.00 €"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {product.stockQuantity ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${product.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {product.active ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`/products/${product.id}`}
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProduitList;
