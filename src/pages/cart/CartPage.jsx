import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2, ShoppingCart, Trash2, X } from "lucide-react";
import {
  clearCart,
  getCart,
  getCartTotals,
  removeCartItem,
  updateCartItem,
} from "../../services/frontoffice/cartStore.service";
import { getCustomerSession } from "../../services/frontoffice/session.service";
import { checkoutCart } from "../../services/frontoffice/checkout.service";
import { useAuth } from "../auth/AuthContext";
import { LoginFrontOffice } from "../../services/auth/frontoffice.service";

const CartPage = () => {
  const [cart, setCart] = useState({ items: [] });
  const [totals, setTotals] = useState({ totalQuantity: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const { customer, guest, loginCustomer } = useAuth();

  // États pour le popup de connexion invité
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const refreshCart = (nextCart) => {
    const snapshot = nextCart ?? getCart();
    setCart(snapshot);
    setTotals(getCartTotals(snapshot));
  };

  useEffect(() => {
    refreshCart();
    const handleUpdate = (event) => refreshCart(event.detail);
    window.addEventListener("cart:updated", handleUpdate);
    return () => window.removeEventListener("cart:updated", handleUpdate);
  }, []);

  const handleQuantityChange = (cartKey, quantity) => {
    updateCartItem(cartKey, quantity);
  };

  const handleRemove = (cartKey) => {
    removeCartItem(cartKey);
  };

  // Checkout pour un client déjà connecté (ou après connexion)
  const handleCheckout = async (customerOverride) => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const sessionCustomer = customerOverride || getCustomerSession();
      const result = await checkoutCart({
        items: cart.items,
        customer: sessionCustomer,
      });
      clearCart();
      setStatus(
        `Commande confirmée (#${result.orderReference || result.orderId}).`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const { customer: loggedCustomer, customerData } = await LoginFrontOffice(
        loginEmail,
        loginPassword
      );
      loginCustomer(customerData);
      setShowLoginModal(false);
      handleCheckout(loggedCustomer);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 border-b border-slate-200 pb-6">
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

      {/* Messages statut / erreur */}
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

      {/* Panier vide */}
      {cart.items.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
          <ShoppingCart size={30} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">Votre panier est vide.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* Liste des articles */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 px-6 py-5"
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
                          : item.priceTaxIncl
                      ).toFixed(2)}
                      €
                    </p>
                    {item.taxRate ? (
                      <p className="text-xs text-slate-400">
                        TVA {Number(item.taxRate).toFixed(2)}%
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
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

          {/* Résumé et bouton de commande */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-fit">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Résumé</h2>
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

            {/* Client connecté : bouton direct */}
            {customer && (
              <button
                type="button"
                onClick={() => handleCheckout()}
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Validation en cours..." : "Valider la commande"}
              </button>
            )}

            {/* Invité : bouton qui ouvre le popup de connexion */}
            {!customer && guest && (
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setShowLoginModal(true);
                }}
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 transition-all"
              >
                Se connecter pour commander
              </button>
            )}
          </div>
        </div>
      )}

      {/* Popup de connexion (invité) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Connectez-vous pour commander
            </h2>
            {loginError && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded bg-red-50 text-red-600 text-sm">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="votre@email.com"
                  required
                  disabled={loginLoading}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Mot de passe
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="••••••••"
                  required
                  disabled={loginLoading}
                />
              </label>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading && <Loader2 size={16} className="animate-spin" />}
                {loginLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
