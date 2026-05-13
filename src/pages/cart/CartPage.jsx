import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import {
  clearCart,
  getCart,
  getCartTotals,
  removeCartItem,
  updateCartItem,
} from "../../services/frontoffice/cartStore.service";
import { getCustomerSession } from "../../services/frontoffice/session.service";
import { checkoutCart } from "../../services/frontoffice/checkout.service";

const CartPage = () => {
  const [cart, setCart] = useState({ items: [] });
  const [totals, setTotals] = useState({ totalQuantity: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const refreshCart = (nextCart) => {
    const snapshot = nextCart ?? getCart();
    setCart(snapshot);
    setTotals(getCartTotals(snapshot));
  };

  useEffect(() => {
    refreshCart();
    const handleUpdate = (event) => {
      refreshCart(event.detail);
    };
    window.addEventListener("cart:updated", handleUpdate);
    return () => window.removeEventListener("cart:updated", handleUpdate);
  }, []);

  const handleQuantityChange = (cartKey, quantity) => {
    updateCartItem(cartKey, quantity);
  };

  const handleRemove = (cartKey) => {
    removeCartItem(cartKey);
  };

  const handleCheckout = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const customer = getCustomerSession();
      const result = await checkoutCart({ items: cart.items, customer });
      clearCart();
      setStatus(
        `Commande confirmee (#${result.orderReference || result.orderId}).`,
      );
    } catch (checkoutError) {
      setError(checkoutError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Votre panier</h1>
          <p className="text-slate-500 text-sm">
            {totals.totalQuantity} article(s)
          </p>
        </div>
        <Link
          to="/frontOffice/products"
          className="text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          Continuer vos achats →
        </Link>
      </div>

      {status && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <ShoppingCart size={18} />
          {status}
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
          <ShoppingCart
            size={30}
            className="mx-auto mb-3 text-slate-300"
          />
          <p className="text-slate-400">Votre panier est vide.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-center justify-between gap-6 px-6 py-5"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {item.name || "Produit"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Ref: {item.reference || "—"}
                    </p>
                    {item.combinationLabel && (
                      <p className="text-xs text-slate-500 mt-1">
                        {item.combinationLabel}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-700 mt-2">
                      {Number(
                        item.priceTaxIncl === null ||
                          item.priceTaxIncl === undefined
                          ? item.price || 0
                          : item.priceTaxIncl,
                      ).toFixed(2)}
                      €
                    </p>
                    {item.taxRate ? (
                      <p className="text-xs text-slate-400">
                        TVA {Number(item.taxRate).toFixed(2)}%
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(item.cartKey, event.target.value)
                      }
                      className="w-20 h-10 rounded-lg border border-slate-200 text-center text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(item.cartKey)}
                      className="text-slate-400 hover:text-red-500"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-fit">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Resume
            </h2>
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Sous-total</span>
              <span>{totals.totalAmount.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
              <span>Livraison</span>
              <span>0.00 €</span>
            </div>
            <div className="flex items-center justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-4">
              <span>Total</span>
              <span>{totals.totalAmount.toFixed(2)} €</span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Validation en cours..." : "Valider la commande"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
