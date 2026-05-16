import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, UserX } from "lucide-react";
import { LoginFrontOffice } from "../../services/auth/frontoffice.service";
import {
  saveCustomerSession,
  saveGuestSession,
} from "../../services/frontoffice/session.service";
import { postGuest } from "../../services/guest.service";
import { useAuth } from "./AuthContext";

const FrontOfficeLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("rakoto@yopmail.com");
  const [password, setPassword] = useState("XvzsX5O0!GBD0uXQ");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loginCustomer, loginGuest } = useAuth();

  // ── Connexion customer ──────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { customer, customerData } = await LoginFrontOffice(
        email,
        password
      );
      saveCustomerSession(customer);
      loginCustomer(customerData);
      navigate("/frontOffice/userSelector");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setError(null);
    setGuestLoading(true);
    try {
      const result = await postGuest({
        acceptLanguage: navigator.language?.slice(0, 8) ?? "fr",
        javascript: true,
        screenResolutionX: window.screen?.width ?? 0,
        screenResolutionY: window.screen?.height ?? 0,
      });

      if (!result?.success || !result?.id) {
        throw new Error("Impossible de créer la session anonyme.");
      }

      saveGuestSession({ id: result.id });
      loginGuest({ id: result.id, isGuest: true });
      navigate("/frontOffice/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold text-sky-600 mb-2">
              Front office
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Connexion</h1>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                disabled={loading || guestLoading}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                disabled={loading || guestLoading}
              />
            </label>

            <button
              type="submit"
              disabled={loading || guestLoading}
              className="mt-6 w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          {/* Séparateur */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">ou</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Bouton navigation anonyme */}
          <button
            type="button"
            onClick={handleGuestAccess}
            disabled={loading || guestLoading}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guestLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserX size={16} />
            )}
            {guestLoading ? "Création en cours..." : "Continuer sans compte"}
          </button>

          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/backoffice"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              Aller au back office →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontOfficeLogin;
