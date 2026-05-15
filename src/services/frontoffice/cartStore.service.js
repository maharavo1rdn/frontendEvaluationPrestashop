import { postCart, putCart, getCartById, deleteCart } from "../cart.service";
import {
  getCustomerSession,
  getGuestSession,
  isGuestSession,
} from "./session.service";
import { findAddressByKeyValue } from "../address.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { findProductOptionValueByKeyValue } from "../productOptionValue.service";
import { getTaxRateForGroup, computeCombinationPrice } from "./pricing.service";
import { getStockAvailableById } from "../stockAvailable.service";

const STORAGE_KEY = "frontoffice_cart";
let syncInFlight = false;
let pendingCart = null;

const syncCartWithServer = async (cart) => {
  const isGuest = isGuestSession();
  const customer = isGuest ? null : getCustomerSession();
  const guest = isGuest ? getGuestSession() : null;

  if (!customer?.id && !guest?.id) return;

  window.dispatchEvent(new CustomEvent("cart:syncing"));

  let address = null;
  if (customer?.id) {
    const addresses = await findAddressByKeyValue("id_customer", customer.id);
    address = addresses?.[0] ?? null;
  }

  try {
    const stored = readCart();
    const psCartId = stored.psCartId ?? cart.psCartId ?? null;

    if (cart.items.length === 0 && psCartId) {
      await deleteCart(psCartId);
      const updatedCart = { items: [], _version: cart._version };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCart));
      return;
    }

    const cartPayload = {
      idCustomer: customer?.id ?? 0,
      idGuest: guest?.id ?? 0,
      idAddressDelivery: address?.id ?? 0,
      idAddressInvoice: address?.id ?? 0,
      idCarrier: 2,
      idCurrency: 1,
      idShop: 1,
      idLang: customer?.idLang ?? 1,
      secureKey: customer?.secureKey ?? "",
      associations: {
        cartRows: cart.items.map((item) => {
          const row = {
            idProduct: item.idProduct,
            idProductAttribute: item.idProductAttribute || 0,
            idAddressDelivery: address?.id ?? 0,
            quantity: item.quantity,
          };
          if (item.cartRowId) row.id = item.cartRowId;
          return row;
        }),
      },
    };

    let response;
    if (psCartId) {
      response = await putCart(psCartId, { id: psCartId, ...cartPayload });
    } else {
      response = await postCart(cartPayload);
    }

    if (response?.success && response?.id) {
      const serverCart = await getCartById(response.id);

      const updatedItems = cart.items.map((localItem) => {
        const serverRow = serverCart.associations?.cartRows?.find(
          (row) =>
            row.idProduct === localItem.idProduct &&
            row.idProductAttribute === localItem.idProductAttribute
        );
        return serverRow
          ? { ...localItem, cartRowId: serverRow.id }
          : localItem;
      });

      const updatedCart = {
        ...cart,
        psCartId: response.id,
        items: updatedItems,
      };

      const latestStored = readCart();
      const shouldKeepLatest =
        (latestStored._version ?? 0) > (cart._version ?? 0);
      const nextCart = shouldKeepLatest
        ? { ...latestStored, psCartId: response.id }
        : updatedCart;

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));

      if (pendingCart && !pendingCart.psCartId) {
        pendingCart = { ...pendingCart, psCartId: response.id };
      }
    }
  } catch (err) {
    console.error("Erreur synchro panier:", err);
  }
};

const enqueueSync = (cart) => {
  pendingCart = cart;
  if (!syncInFlight) processSyncQueue();
};

const processSyncQueue = async () => {
  if (!pendingCart) return;
  const cart = pendingCart;
  pendingCart = null;
  syncInFlight = true;
  await syncCartWithServer(cart);
  syncInFlight = false;
  if (pendingCart) processSyncQueue();
};

const normalizeCart = (raw) => {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) {
    return { items: [], _version: 0, psCartId: raw?.psCartId ?? null };
  }
  return {
    _version: Number(raw._version ?? 0),
    psCartId: raw.psCartId ?? null,
    items: raw.items.map((item) => ({
      ...item,
      idProductAttribute: item.idProductAttribute ?? "0",
      cartKey:
        item.cartKey ??
        `${item.idProduct ?? ""}_${item.idProductAttribute ?? "0"}`,
    })),
  };
};

const readCart = () => {
  if (typeof window === "undefined") return { items: [], _version: 0 };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [], _version: 0 };
    return normalizeCart(JSON.parse(stored));
  } catch {
    return { items: [], _version: 0 };
  }
};

const writeCart = (cart) => {
  if (typeof window === "undefined") return cart;
  const nextCart = { ...cart, _version: (cart._version ?? 0) + 1 };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: nextCart }));
  enqueueSync(nextCart);
  return nextCart;
};

// ─── Helpers item ─────────────────────────────────────────────────────────

const buildItem = (product, quantity) => {
  const idProduct = String(product.id ?? product.idProduct ?? "");
  const idProductAttribute = String(product.idProductAttribute ?? "0");
  return {
    cartKey: `${idProduct}_${idProductAttribute}`,
    idProduct,
    idProductAttribute,
    name: product.name ?? "",
    reference: product.reference ?? "",
    price: Number(product.price ?? 0),
    priceTaxIncl:
      product.priceTaxIncl === null || product.priceTaxIncl === undefined
        ? null
        : Number(product.priceTaxIncl),
    taxRate:
      product.taxRate === null || product.taxRate === undefined
        ? null
        : Number(product.taxRate),
    idTaxRulesGroup: product.idTaxRulesGroup ?? null,
    combinationLabel: product.combinationLabel ?? "",
    quantity: Number(quantity ?? 1),
    stockQuantity:
      product.stockQuantity === null || product.stockQuantity === undefined
        ? null
        : Number(product.stockQuantity),
  };
};

// ─── API publique (inchangée) ─────────────────────────────────────────────

export const getCart = () => readCart();

export const getCartTotals = (cart = readCart()) => {
  const totalQuantity = cart.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const totalAmount = cart.items.reduce((sum, item) => {
    const unit =
      item.priceTaxIncl === null || item.priceTaxIncl === undefined
        ? Number(item.price || 0)
        : Number(item.priceTaxIncl || 0);
    return sum + unit * Number(item.quantity || 0);
  }, 0);
  return { totalQuantity, totalAmount };
};

export const addCartItem = (product, quantity = 1) => {
  const cart = readCart();
  const item = buildItem(product, quantity);
  if (!item.idProduct) return cart;
  const existing = cart.items.find((entry) => entry.cartKey === item.cartKey);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  return writeCart(cart);
};

export const updateCartItem = (cartKey, quantity) => {
  const cart = readCart();
  const nextQuantity = Number(quantity ?? 0);
  cart.items = cart.items
    .map((item) =>
      item.cartKey === String(cartKey)
        ? { ...item, quantity: nextQuantity }
        : item
    )
    .filter((item) => item.quantity > 0);
  return writeCart(cart);
};

export const removeCartItem = (cartKey) => {
  const cart = readCart();
  cart.items = cart.items.filter((item) => item.cartKey !== String(cartKey));
  return writeCart(cart);
};

export const clearCart = async () => {
  const current = readCart();

  window.localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent("cart:updated", {
      detail: { items: [], _version: 0 },
    })
  );

  return { items: [], _version: 0 };
};

export const loadCartFromServer = async (serverCart) => {
  if (!serverCart || !serverCart.id) return;

  const rows = serverCart.associations?.cartRows ?? [];
  const items = [];

  for (const row of rows) {
    const productId = row.idProduct;
    const attrId = row.idProductAttribute || 0;
    const quantity = Number(row.quantity ?? 1);

    let name = null;
    let reference = null;
    let price = null;
    let priceTaxIncl = null;
    let taxRate = null;
    let idTaxRulesGroup = null;
    let combinationLabel = "";
    let stockQuantity = null;

    try {
      // 1. Récupérer le produit complet
      const products = await findProductByKeyValue("id", productId);
      const product = products?.[0];

      if (product) {
        name = product.name ?? null;
        reference = product.reference ?? null;
        idTaxRulesGroup = product.idTaxRulesGroup ?? null;

        // 2. Gérer la déclinaison si présente
        let combination = null;
        if (attrId && String(attrId) !== "0") {
          const combos = await findCombinationsByProductId(product.id).catch(
            () => []
          );
          combination = combos.find((c) => String(c.id) === String(attrId));
          if (combination) {
            if (combination.associations?.productOptionValues?.length) {
              const values = await Promise.all(
                combination.associations.productOptionValues.map(
                  async (valueId) => {
                    const result = await findProductOptionValueByKeyValue(
                      "id",
                      valueId
                    ).catch(() => []);
                    return result?.[0]?.name ?? "";
                  }
                )
              );
              combinationLabel = values.filter(Boolean).join(" / ");
            } else {
              combinationLabel = `Combinaison #${combination.id}`;
            }
          }
        }

        // 3. Prix et TVA
        const taxRateValue = await getTaxRateForGroup(
          product.idTaxRulesGroup
        ).catch(() => 0);
        taxRate = taxRateValue;

        const { priceExcl, priceIncl } = computeCombinationPrice({
          basePrice: product.price ?? 0,
          combinationPriceImpact: combination?.price ?? 0,
          taxRate: taxRateValue,
        });
        price = Number(priceExcl);
        priceTaxIncl = Number(priceIncl);

        // 4. Stock
        if (product.associations?.stockAvailables?.length) {
          const stockId = product.associations.stockAvailables[0].id;
          if (stockId) {
            const stock = await getStockAvailableById(stockId).catch(
              () => null
            );
            stockQuantity = stock?.quantity ?? null;
          }
        }
      }
    } catch (err) {
      console.warn(`Impossible d’enrichir le produit ${productId}:`, err);
    }

    items.push({
      cartKey: `${productId ?? ""}_${attrId ?? "0"}`,
      idProduct: String(productId ?? ""),
      idProductAttribute: String(attrId ?? "0"),
      name,
      reference,
      price,
      priceTaxIncl,
      taxRate,
      idTaxRulesGroup,
      combinationLabel,
      quantity,
      stockQuantity,
      cartRowId: row.id,
    });
  }

  const cart = {
    items,
    _version: 0,
    psCartId: serverCart.id,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
};
