import { Link } from "react-router-dom";

const BackOfficeLogin = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold text-sky-600 mb-2">Back office</p>
            <h1 className="text-3xl font-bold text-slate-900">Connexion</h1>
          </div>

          <form className="space-y-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                placeholder="prenom.nom@entreprise.com"
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Mot de passe
              <input
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </label>

            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 transition-all"
            >
              Se connecter
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
