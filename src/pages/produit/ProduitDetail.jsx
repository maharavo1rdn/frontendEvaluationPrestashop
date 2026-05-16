import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  LogIn,
} from "lucide-react";
import { parseProduct } from "../../XMLUtil/parser/Product.parser";
import {
  getStockAvailableById,
  getStockByProductAndAttribute,
} from "../../services/stockAvailable.service";
import { addCartItem } from "../../services/frontoffice/cartStore.service";
import { findCombinationsByProductId } from "../../services/combination.service";
import { findProductOptionValueByKeyValue } from "../../services/productOptionValue.service";
import {
  computeCombinationPrice,
  getTaxRateForGroup,
} from "../../services/frontoffice/pricing.service";
import { API_URL, WS_KEY } from "../../config/config.service";

const fetchImageBlob = async (productId, imageId) => {
  try {
    const response = await fetch(
      `${API_URL()}/images/products/${productId}/${imageId}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        },
      }
    );
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(`Erreur chargement image ${imageId}:`, err);
    return null;
  }
};

const extractImageIds = (product) => {
  const raw = product?.associations?.images;
  if (!raw || raw.length === 0) return [];
  return Array.isArray(raw)
    ? raw.map((img) => String(typeof img === "object" ? img.id : img))
    : [];
};

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
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [comboStocks, setComboStocks] = useState({});

  useEffect(() => {
    fetchProductDetails();
    return () => {
      images.forEach((img) => {
        if (img.url) URL.revokeObjectURL(img.url);
      });
    };
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL()}/products/${id}?output_format=XML`,
        {
          headers: {
            Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
            Accept: "application/xml",
          },
        }
      );

      if (!response.ok)
        throw new Error(
          `Erreur ${response.status} : Impossible de charger ce produit.`
        );

      const xmlText = await response.text();
      const parsed = parseProduct(xmlText);
      const stockId = parsed?.associations?.stockAvailables?.[0]?.id;

      const [stock, rate, combos] = await Promise.all([
        stockId
          ? getStockAvailableById(stockId).catch(() => null)
          : Promise.resolve(null),
        getTaxRateForGroup(parsed?.idTaxRulesGroup),
        findCombinationsByProductId(parsed.id).catch(() => []),
      ]);

      setTaxRate(rate);

      // Chargement des images
      const imageIds = extractImageIds(parsed);
      const loadedImages = await Promise.all(
        imageIds.map(async (imgId) => {
          const url = await fetchImageBlob(id, imgId);
          return { id: imgId, url };
        })
      );
      const validImages = loadedImages.filter((img) => img.url !== null);
      setImages(validImages);
      setActiveImageIndex(0);

      setCombinations(combos || []);

      if (combos?.length) {
        const stocks = {};
        await Promise.all(
          combos.map(async (combo) => {
            try {
              const result = await getStockByProductAndAttribute(
                parsed.id,
                combo.id
              );
              stocks[combo.id] = result?.[0]?.quantity ?? null;
            } catch {
              stocks[combo.id] = null;
            }
          })
        );
        setComboStocks(stocks);

        const defaultCombo = combos.find((combo) => combo.defaultOn);
        setSelectedCombinationId(defaultCombo?.id || combos[0].id || "");

        const labels = {};
        for (const combo of combos) {
          if (!combo?.associations?.productOptionValues?.length) {
            labels[combo.id] = `Combinaison #${combo.id}`;
            continue;
          }
          const values = await Promise.all(
            combo.associations.productOptionValues.map(async (valueId) => {
              const result = await findProductOptionValueByKeyValue(
                "id",
                valueId
              );
              return result?.[0]?.name ?? "";
            })
          );
          labels[combo.id] = values.filter(Boolean).join(" / ");
        }
        setCombinationLabels(labels);
      }

      setProduct({ ...parsed, stockQuantity: stock?.quantity ?? null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const selectedStock =
      combinations.length > 0
        ? comboStocks[selectedCombinationId] ?? null
        : product.stockQuantity;

    if (selectedStock !== null && selectedStock <= 0) {
      setStatus("Stock insuffisant pour ajouter ce produit.");
      return;
    }

    const selectedCombination = combinations.find(
      (combo) => combo.id === selectedCombinationId
    );
    const { priceExcl, priceIncl } = computeCombinationPrice({
      basePrice: product.price,
      combinationPriceImpact: selectedCombination?.price ?? 0,
      taxRate,
    });
    addCartItem({
      id: product.id,
      name: product.name,
      price: priceExcl,
      priceTaxIncl: priceIncl,
      reference: product.reference,
      stockQuantity: selectedStock,
      idTaxRulesGroup: product.idTaxRulesGroup,
      idProductAttribute: selectedCombination?.id ?? "0",
      combinationLabel: combinationLabels[selectedCombination?.id] ?? "",
      taxRate,
    });
    setStatus("Produit ajouté au panier.");
  };

  const activeCombination = combinations.find(
    (combo) => combo.id === selectedCombinationId
  );
  const activePrice = computeCombinationPrice({
    basePrice: product?.price ?? 0,
    combinationPriceImpact: activeCombination?.price ?? 0,
    taxRate,
  });
  
  const displayedStock =
    combinations.length > 0
      ? comboStocks[selectedCombinationId] ?? null
      : product?.stockQuantity;

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
          to="/frontOffice/products"
          className="mt-4 inline-flex items-center gap-2 text-sky-500 font-medium"
        >
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/frontOffice/products"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-500"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        <Link
          to="/frontOffice/cart"
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

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Galerie */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
              {images.length > 0 ? (
                <img
                  src={images[activeImageIndex]?.url}
                  alt={product?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageOff size={48} />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        (i) => (i - 1 + images.length) % images.length
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow text-slate-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((i) => (i + 1) % images.length)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow text-slate-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                      activeImageIndex === index
                        ? "border-sky-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product?.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos + prix */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                {product?.name || "N/A"}
              </h1>
              <p className="text-sm text-slate-500 font-mono mb-4">
                Ref: {product?.reference || "—"}
              </p>

              {combinations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                    Déclinaison
                  </p>
                  <select
                    value={selectedCombinationId}
                    onChange={(e) => setSelectedCombinationId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {combinations.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {combinationLabels[combo.id] ||
                          `Combinaison #${combo.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <p className="text-3xl font-bold text-sky-600 mb-1">
                {product?.price
                  ? `${Number(activePrice.priceIncl).toFixed(2)} €`
                  : "— €"}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {taxRate ? `TTC (TVA ${Number(taxRate).toFixed(2)}%)` : "TTC"}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Stock :{" "}
                <span
                  className={`font-semibold ${
                    displayedStock !== null && displayedStock > 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {displayedStock !== null ? displayedStock : "—"}
                </span>
              </p>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  (displayedStock !== null && displayedStock <= 0) ||
                  (combinations.length === 0 &&
                    product?.stockQuantity !== null &&
                    product?.stockQuantity <= 0)
                }
                className="w-full px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Type
            </p>
            <p className="text-sm font-bold text-slate-900">
              {product?.type || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Condition
            </p>
            <p className="text-sm font-bold text-slate-900">
              {product?.condition || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Actif
            </p>
            <span
              className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                product?.active
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {product?.active ? "Oui" : "Non"}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Poids
            </p>
            <p className="text-sm font-bold text-slate-900">
              {product?.weight ? `${product.weight} kg` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Fabricant
            </p>
            <p className="text-sm font-bold text-slate-900">
              {product?.idManufacturer || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Catégorie
            </p>
            <p className="text-sm font-bold text-slate-900">
              {product?.idCategoryDefault || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Créé le
            </p>
            <p className="text-sm font-bold text-slate-900">
              {product?.dateAdd
                ? new Date(product.dateAdd).toLocaleDateString("fr-FR")
                : "—"}
            </p>
          </div>
        </div>

        {product?.description && (
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
              Description
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProduitDetail;
