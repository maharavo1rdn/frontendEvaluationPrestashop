import { useEffect, useState } from "react";
import { getAll } from "../../services/order.service";
import { postOrderHistory } from "../../services/orderHistory.service";

const CommandeList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setStatus("");
    try {
      const fetchedOrders = await getAll();
      setOrders(fetchedOrders || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateState = async (idOrder, idOrderState) => {
    try {
      setStatus("Mise à jour de l'état...");
      await postOrderHistory({
        idOrder: idOrder,
        idOrderState: idOrderState,
      });
      setStatus("État mis à jour avec succès !");
      fetchOrders();
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (loading && !orders.length) return <div className="p-4">Chargement des commandes...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur : {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Liste des commandes</h1>
      
      {status && (
        <div className={`mb-4 p-3 rounded shadow-sm ${status.includes("Erreur") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
          {status}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client (ID)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total payé</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État Actuel</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.idCustomer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(order.totalPaidTaxIncl).toFixed(2)} €</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {order.current_state_label || order.currentState}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleUpdateState(order.id, 2)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Paiement effectué
                    </button>
                    <button
                      onClick={() => handleUpdateState(order.id, 6)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Annuler
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                  Aucune commande trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommandeList;
