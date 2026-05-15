import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ImageOff,
  X,
  Check,
} from "lucide-react";
import { getAllEnriched } from "../../services/product.service";
import {
  findStockAvailableByProductAttribute,
  updateStockAvailable,
  postStockAvailable,
} from "../../services/stockAvailable.service";
import { findCombinationsByProductId } from "../../services/combination.service";
import { findProductOptionValueByKeyValue } from "../../services/productOptionValue.service";
import { API_URL, WS_KEY } from "../../config/config.service";

const getFirstImageId = (product) => {
  const raw = product?.associations?.images;
  if (!raw || raw.length === 0) return null;
  const imagesArray = Array.isArray(raw) ? raw : [raw];
  const first = imagesArray[0];
  return String(typeof first === "object" ? first.id : first);
};

const ProductThumbnail = ({ productId, imageId }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!imageId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let currentUrl = null;

    fetch(`${API_URL()}/images/products/${productId}/${imageId}`, {
      headers: { Authorization: `Basic ${btoa(WS_KEY() + ":")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Image non disponible");
        return res.blob();
      })
      .then((blob) => {
        if (!cancelled && blob) {
          currentUrl = URL.createObjectURL(blob);
          setUrl(currentUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setImgError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [productId, imageId]);

  if (loading)
    return <Loader2 size={18} className="animate-spin text-slate-400" />;
  if (imgError || !url)
    return <ImageOff size={18} className="text-slate-300" />;
  return (
    <img
      src={url}
      alt=""
      className="h-10 w-10 object-cover rounded"
      onError={() => setImgError(true)}
    />
  );
};

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalProduct, setModalProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [combosData, setCombosData] = useState([]);
  const [simpleQuantity, setSimpleQuantity] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllEnriched();
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAdjustStock = async (product) => {
    setModalProduct(product);
    setModalLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const combos = await findCombinationsByProductId(product.id).catch(
        () => []
      );

      if (combos.length > 0) {
        const items = [];
        for (const combo of combos) {
          let label = `Combinaison #${combo.id}`;
          if (combo.associations?.productOptionValues?.length) {
            const values = await Promise.all(
              combo.associations.productOptionValues.map(async (valueId) => {
                const result = await findProductOptionValueByKeyValue(
                  "id",
                  valueId
                ).catch(() => []);
                return result?.[0]?.name ?? "";
              })
            );
            label = values.filter(Boolean).join(" / ");
          }

          const stockEntries = await findStockAvailableByProductAttribute(
            product.id,
            combo.id
          ).catch(() => []);
          const stockObj = stockEntries?.[0] || null;
          const currentQty = stockObj?.quantity ?? 0;
          const stockId = stockObj?.id || null;

          items.push({
            combinationId: combo.id,
            label,
            currentQty,
            stockId,
            newQty: currentQty,
          });
        }
        setCombosData(items);
      } else {
        const stockEntries = await findStockAvailableByProductAttribute(
          product.id,
          0
        ).catch(() => []);
        const stockObj = stockEntries?.[0] || null;
        const currentQty = stockObj?.quantity ?? 0;
        setSimpleQuantity(currentQty);
        setCombosData([]);
      }
    } catch (err) {
      setSaveError("Impossible de charger les stocks.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (combosData.length > 0) {
        for (const item of combosData) {
          const payload = {
            idProduct: modalProduct.id,
            idProductAttribute: item.combinationId,
            quantity: item.newQty,
            id: item.stockId,
          };
          console.log("combo data", payload);
          
        }
    } else {
        const stockEntries = await findStockAvailableByProductAttribute(
            modalProduct.id,
            0
        );
        const stockObj = stockEntries?.[0] || null;
        const payload = {
          idProduct: modalProduct.id,
          idProductAttribute: 0,
          quantity: simpleQuantity,
          id: stockObj?.id,
        };
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setModalProduct(null);
        loadProducts();
      }, 1000);
    } catch (err) {
      setSaveError(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModalProduct(null);
    setCombosData([]);
    setSimpleQuantity(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-slate-400">
        <Loader2 size={32} className="animate-spin" />
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
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestion des stocks
          </h1>
          <p className="text-slate-500 text-sm">{products.length} produit(s)</p>
        </div>
        <Link
          to="/frontOffice/products"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-500"
        >
          <ArrowLeft size={16} />
          Retour au catalogue
        </Link>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Produit
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Référence
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                Stock total
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail
                      productId={product.id}
                      imageId={getFirstImageId(product)}
                    />
                    <span className="font-medium text-slate-900 text-sm">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {product.reference || "—"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      (product.stockQuantity ?? 0) > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.stockQuantity ?? "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleAdjustStock(product)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    Ajuster le stock
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  Aucun produit trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {modalProduct.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-sky-500" />
              </div>
            ) : (
              <>
                {saveError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
                    <Check size={16} />
                    Stock mis à jour avec succès.
                  </div>
                )}

                {combosData.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Stock actuel :{" "}
                      <strong>{modalProduct.stockQuantity ?? "—"}</strong>
                    </p>
                    <label className="block text-sm font-medium text-slate-700">
                      Nouvelle quantité
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={simpleQuantity}
                      onChange={(e) =>
                        setSimpleQuantity(
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    />
                  </div>
                )}

                {combosData.length > 0 && (
                  <div className="space-y-4">
                    {combosData.map((item) => (
                      <div
                        key={item.combinationId}
                        className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-slate-500">
                            Actuel : {item.currentQty}
                          </p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={item.newQty}
                          onChange={(e) => {
                            const newVal = Math.max(
                              0,
                              parseInt(e.target.value) || 0
                            );
                            setCombosData((prev) =>
                              prev.map((c) =>
                                c.combinationId === item.combinationId
                                  ? { ...c, newQty: newVal }
                                  : c
                              )
                            );
                          }}
                          className="w-24 h-10 rounded-lg border border-slate-200 px-3 text-sm text-center"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-6 w-full rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
