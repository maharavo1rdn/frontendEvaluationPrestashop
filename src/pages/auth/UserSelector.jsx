import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Loader2, User, LogIn } from "lucide-react";
import {
  saveCustomerSession,
  getCustomerSession,
} from "../../services/frontoffice/session.service";
import { getAll } from "../../services/customer.service";
import { getUnorderedCartsByCustomer } from "../../services/cart.service";
import { loadCartFromServer } from "../../services/frontoffice/cartStore.service";

const UserSelector = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentSession = getCustomerSession();
  const isAlreadyConnected = !!currentSession?.id;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const unordersCarts = await getUnorderedCartsByCustomer(
          currentSession?.id
        );
        if (unordersCarts.length > 0) {
          await loadCartFromServer(unordersCarts[0]);
        }
        setLoading(true);
        setError(null);
        const data = await getAll();
        setCustomers(data || []);
      } catch (err) {
        console.error(err.message);
        
        setError("Impossible de charger la liste des utilisateurs.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleSelectUser = (customer) => {
    saveCustomerSession({
      id: customer.id,
      email: customer.email,
      firstname: customer.firstname,
      lastname: customer.lastname,
      idLang: customer.idLang,
      secureKey: customer.secureKey,
    });
    navigate("/frontOffice/products");
  };

  const handleContinue = () => {
    navigate("/frontOffice/products");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold text-sky-600 mb-2">
              Front office
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              {isAlreadyConnected
                ? "Vous êtes connecté"
                : "Choisir un utilisateur"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isAlreadyConnected
                ? "Vous pouvez continuer votre navigation ou changer d'utilisateur."
                : "Cliquez sur un compte pour vous connecter."}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Bouton Continuer si déjà connecté */}
          {isAlreadyConnected && (
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-all"
            >
              <LogIn size={18} />
              Continuer la navigation
            </button>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-sky-500" size={32} />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User size={48} className="mx-auto mb-4 text-slate-300" />
              Aucun utilisateur trouvé.
            </div>
          ) : (
            <ul className="space-y-3">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <button
                    onClick={() => handleSelectUser(customer)}
                    className="w-full text-left flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold text-sm">
                      {customer.firstname?.charAt(0)}
                      {customer.lastname?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {customer.firstname} {customer.lastname}
                      </p>
                      <p className="text-sm text-slate-500">{customer.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

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

export default UserSelector;
