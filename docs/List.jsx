import { useParams } from "react-router-dom";
import { getOrderById } from "../../services/order.service";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

const List = () => {
  const { id } = useParams();
  const [order, setOrder] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const [total, setTotal] = useState(0);
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOrderById(id);
      if (data && data.id) {
        setOrder(data);
      }
      const totaux = data.associations.orderRows.reduce(
        (sum, row) =>
          sum + parseFloat(row.productPrice) * parseInt(row.productQuantity),
        0
      );
      setTotal(totaux);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Link
          to="/frontOffice/commandes/customers"
          className="mt-4 inline-flex items-center gap-2 text-sky-500 font-medium"
        >
          <ArrowLeft size={16} /> Retour aux commandes
        </Link>
      </div>
    );
  }
  const rows = order?.associations?.orderRows ?? [];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">
          Lignes de commande
        </h2>
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Produit
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Prix unitaire
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                  Quantité
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const quantity = parseInt(row.productQuantity, 10) || 1;
                const unitPrice = parseFloat(row.unitPriceTaxIncl || 0);
                const total = quantity * unitPrice;
                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-900">
                        {row.productName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {row.productReference}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-700">
                      {unitPrice.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600">
                      {quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
                      {total.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm text-right text-slate-700"></td>
                <td className="px-6 py-4 text-sm text-right text-slate-900">
                  Total
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 text-slate-900">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(total ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-8 text-center text-sm text-slate-500">
          Aucune ligne de commande trouvée.
        </div>
      )}
    </div>
  );
};
export default List;
