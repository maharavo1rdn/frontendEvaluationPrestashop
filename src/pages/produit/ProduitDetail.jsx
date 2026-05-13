import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { parseProduct } from "../../XMLUtil/parser/Product.parser";
import { getStockAvailableById } from "../../services/stockAvailable.service";
import { addCartItem } from "../../services/frontoffice/cartStore.service";
import { findCombinationsByProductId } from "../../services/combination.service";
import { findProductOptionValueByKeyValue } from "../../services/productOptionValue.service";
import {
  computeCombinationPrice,
  getTaxRateForGroup,
} from "../../services/frontoffice/pricing.service";

const ProduitDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [combinations, setCombinations] = useState([]);
  const [selectedCombinationId, setSelectedCombinationId] = useState("");
  const [combinationLabels, setCombinationLabels] = useState({});
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = `${import.meta.env.VITE_API_URL}/products/${id}`;
      const WS_KEY = import.meta.env.VITE_WS_KEY;

      const response = await fetch(`${API_URL}?output_format=XML`, {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY + ":")}`,
          Accept: "application/xml",
        },
      });

      if (!response.ok)
        throw new Error(
          `Erreur ${response.status} : Impossible de charger ce produit.`,
        );

      const xmlText = await response.text();
      const parsed = parseProduct(xmlText);
      const stockId = parsed?.associations?.stockAvailables?.[0]?.id;
      let stockQuantity = null;
      if (stockId) {
        try {
          const stock = await getStockAvailableById(stockId);
          stockQuantity = stock?.quantity ?? null;
        } catch (stockError) {
          stockQuantity = null;
        }
      }
      const rate = await getTaxRateForGroup(parsed?.idTaxRulesGroup);
      setTaxRate(rate);

      const combos = await findCombinationsByProductId(parsed.id);
      setCombinations(combos || []);
      if (combos?.length) {
        const defaultCombo = combos.find((combo) => combo.defaultOn);
        setSelectedCombinationId(defaultCombo?.id || combos[0].id || "");
        const labels = {};
        for (const combo of combos) {
          if (!combo?.associations?.productOptionValues?.length) {
            labels[combo.id] = "";
            continue;
          }
          const values = await Promise.all(
            combo.associations.productOptionValues.map(async (valueId) => {
              const result = await findProductOptionValueByKeyValue(
                "id",
                valueId,
              );
              return result?.[0]?.name ?? "";
            }),
          );
          labels[combo.id] = values.filter(Boolean).join(" / ");
        }
        setCombinationLabels(labels);
      }

      setProduct({ ...parsed, stockQuantity });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stockQuantity !== null && product.stockQuantity <= 0) {
      setStatus("Stock insuffisant pour ajouter ce produit.");
      return;
    }
    const selectedCombination = combinations.find(
      (combo) => combo.id === selectedCombinationId,
    );
    const combinationPrice = selectedCombination?.price ?? 0;
    const { priceExcl, priceIncl } = computeCombinationPrice({
      basePrice: product.price,
      combinationPriceImpact: combinationPrice,
      taxRate,
    });
    addCartItem({
      id: product.id,
      name: product.name,
      price: priceExcl,
      priceTaxIncl: priceIncl,
      reference: product.reference,
      stockQuantity: product.stockQuantity,
      idTaxRulesGroup: product.idTaxRulesGroup,
      idProductAttribute: selectedCombination?.id ?? "0",
      combinationLabel: combinationLabels[selectedCombination?.id] ?? "",
      taxRate,
    });
    setStatus("Produit ajoute au panier.");
  };

  const activeCombination = combinations.find(
    (combo) => combo.id === selectedCombinationId,
  );
  const activePrice = computeCombinationPrice({
    basePrice: product?.price ?? 0,
    combinationPriceImpact: activeCombination?.price ?? 0,
    taxRate,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={32} className="animate-spin text-sky-500 mb-4" />
        <p className="text-sm font-medium">
          Chargement des détails du produit...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Link
          to="/products"
          className="mt-4 inline-flex items-center gap-2 text-sky-500 font-medium"
        >
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/products"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-500"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        <Link
          to="/cart"
          className="text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          Voir le panier →
        </Link>
      </div>

      {status && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded flex items-center gap-2 text-sm font-medium">
          {status}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-sky-500 mx-auto mb-3" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {product?.name || "N/A"}
                </h1>
                <p className="text-sm text-slate-500 font-mono">
                  Ref: {product?.reference || "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-sky-600">
                  {product?.price
                    ? `${Number(activePrice.priceIncl).toFixed(2)} €`
                    : "— €"}
                </p>
                <p className="text-xs text-slate-400">
                  {taxRate ? `TTC (TVA ${Number(taxRate).toFixed(2)}%)` : "TTC"}
                </p>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>

          {combinations.length > 0 && (
            <div className="p-6 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Declinaison
              </p>
              <select
                value={selectedCombinationId}
                onChange={(event) => setSelectedCombinationId(event.target.value)}
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-900"
              >
                {combinations.map((combo) => (
                  <option key={combo.id} value={combo.id}>
                    {combinationLabels[combo.id] || `Combinaison #${combo.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Détails */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Type</p>
              <p className="text-sm font-bold text-slate-900">{product?.type || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Condition</p>
              <p className="text-sm font-bold text-slate-900">{product?.condition || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Stock</p>
              <p className="text-sm font-bold text-slate-900">{product?.stockQuantity ?? "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Actif</p>
              <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${product?.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                {product?.active ? "Oui" : "Non"}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Poids</p>
              <p className="text-sm font-bold text-slate-900">{product?.weight ? `${product.weight} kg` : "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Fabricant</p>
              <p className="text-sm font-bold text-slate-900">{product?.idManufacturer || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Catégorie</p>
              <p className="text-sm font-bold text-slate-900">{product?.idCategoryDefault || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Créé le</p>
              <p className="text-sm font-bold text-slate-900">
                {product?.dateAdd ? new Date(product.dateAdd).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
          </div>

          {/* Description */}
          {product?.description && (
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProduitDetail;
