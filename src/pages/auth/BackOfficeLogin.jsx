import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { LoginBackOffice } from "../../services/auth/backoffice.service";
import { useAuth } from "../auth/AuthContext";
const BackOfficeLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("maharavordn@gmail.com");
  const [password, setPassword] = useState("p@ssw0rd00319317");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loginAdmin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const employee = await LoginBackOffice(email, password);
      loginAdmin(employee);
      navigate("/backOffice/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold text-sky-600 mb-2">
              Back office
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
                placeholder="prenom.nom@entreprise.com"
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                disabled={loading}
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
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 space-y-2 flex flex-col items-center text-sm">
            <Link
              to="/"
              className="text-sky-600 hover:text-sky-700 font-medium"
            >
              Retour front office →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackOfficeLogin;
