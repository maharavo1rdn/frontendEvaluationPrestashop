const STORAGE_KEY = "frontoffice_cart";

const normalizeCart = (raw) => {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) {
    return { items: [] };
  }
  return {
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
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [] };
    return normalizeCart(JSON.parse(stored));
  } catch (error) {
    return { items: [] };
  }
};

const writeCart = (cart) => {
  if (typeof window === "undefined") return cart;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
  }
  return cart;
};

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

export const getCart = () => readCart();

export const getCartTotals = (cart = readCart()) => {
  const totalQuantity = cart.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
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

  const existing = cart.items.find(
    (entry) => entry.cartKey === item.cartKey,
  );
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
        : item,
    )
    .filter((item) => item.quantity > 0);

  return writeCart(cart);
};

export const removeCartItem = (cartKey) => {
  const cart = readCart();
  cart.items = cart.items.filter(
    (item) => item.cartKey !== String(cartKey),
  );
  return writeCart(cart);
};

export const clearCart = () => writeCart({ items: [] });
