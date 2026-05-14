import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Flame, Sparkles, ShoppingCart, ImageOff, Loader2 } from "lucide-react";
import { findCombinationsByProductId } from "../../services/combination.service";
import { findProductOptionValueByKeyValue } from "../../services/productOptionValue.service";
import { API_URL, WS_KEY } from "../../config/config.service";

const loadCombinations = async (productId) => {
  const combos = await findCombinationsByProductId(productId).catch(() => []);
  if (!combos?.length) return [];

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
        ).catch(() => []);
        return result?.[0]?.name ?? "";
      })
    );
    labels[combo.id] = values.filter(Boolean).join(" / ");
  }

  return combos.map((combo) => ({
    ...combo,
    label: labels[combo.id] || `#${combo.id}`,
  }));
};

const ProductCard = ({ product, onAddToCart, status }) => {
  const [combinations, setCombinations] = useState([]);
  const [selectedComboId, setSelectedComboId] = useState("");
  const [combosLoading, setCombosLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const firstImageId = useMemo(() => {
    const raw = product?.associations?.images;
    if (!raw || raw.length === 0) return null;

    const imagesArray = Array.isArray(raw) ? raw : [raw];
    const first = imagesArray[0];

    return String(typeof first === "object" ? first.id : first);
  }, [product]);

  // 2. Chargement des déclinaisons
  useEffect(() => {
    if (product.type === "combinations") {
      setCombosLoading(true);
      loadCombinations(product.id)
        .then((combos) => {
          setCombinations(combos);
          const defaultCombo = combos.find((c) => c.defaultOn) ?? combos[0];
          if (defaultCombo) setSelectedComboId(defaultCombo.id);
        })
        .finally(() => setCombosLoading(false));
    }
  }, [product.id, product.type]);

  // 3. Chargement de l'image via Blob (Authentification WebService)
  useEffect(() => {
    let currentUrl = null;

    if (firstImageId) {
      let cancelled = false;
      setImageLoading(true);

      fetch(`${API_URL()}/images/products/${product.id}/${firstImageId}`, {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Image non disponible");
          return res.blob();
        })
        .then((blob) => {
          if (!cancelled && blob) {
            currentUrl = URL.createObjectURL(blob);
            setImageUrl(currentUrl);
            setImageLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setImageUrl(null);
            setImageLoading(false);
          }
        });

      return () => {
        cancelled = true;
        if (currentUrl) URL.revokeObjectURL(currentUrl);
      };
    } else {
      setImageLoading(false);
      setImageUrl(null);
    }
  }, [product.id, firstImageId]);

  // 4. Badges et Stock
  const freshnessBadge = useMemo(() => {
    if (!product.dateAvailable) return null;
    const availableDate = new Date(product.dateAvailable);
    availableDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today - availableDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 border border-orange-200">
          <Flame size={10} /> HOT
        </span>
      );
    if (diffDays <= 7)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
          <Sparkles size={10} /> NEW
        </span>
      );
    return null;
  }, [product.dateAvailable, today]);

  const inStock = product.stockQuantity === null || product.stockQuantity > 0;
  const selectedCombo = combinations.find((c) => c.id === selectedComboId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200 group h-full">
      {/* Image Container */}
      <Link
        to={`/frontOffice/products/${product.id}`}
        className="block relative aspect-[4/3] bg-slate-50 overflow-hidden"
      >
        {imageLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ImageOff size={32} />
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {freshnessBadge}
          {!inStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-white shadow-sm">
              Rupture
            </span>
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <Link
            to={`/frontOffice/products/${product.id}`}
            className="text-sm font-bold text-slate-900 hover:text-sky-600 transition-colors line-clamp-2 leading-snug"
          >
            {product.name || "Produit sans nom"}
          </Link>
          {product.reference && (
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Ref: {product.reference}
            </p>
          )}
        </div>

        {/* Sélecteur de déclinaisons */}
        {product.type === "combinations" && (
          <div className="min-h-[32px]">
            {combosLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
                <Loader2 size={12} className="animate-spin" />
                Chargement options...
              </div>
            ) : combinations.length > 0 ? (
              <select
                value={selectedComboId}
                onChange={(e) => setSelectedComboId(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                {combinations.map((combo) => (
                  <option key={combo.id} value={combo.id}>
                    {combo.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        )}

        {/* Prix et Action */}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {product.price ? `${Number(product.price).toFixed(2)} €` : "—"}
            </p>
            <p
              className={`text-[10px] font-medium ${
                inStock ? "text-slate-400" : "text-red-400"
              }`}
            >
              Stock : {product.stockQuantity ?? "N/A"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(product, selectedCombo ?? null)}
            disabled={!inStock}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          >
            <ShoppingCart size={13} />
            Ajouter
          </button>
        </div>

        {status && (
          <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-center animate-pulse">
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
