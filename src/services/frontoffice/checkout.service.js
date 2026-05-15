import { getCart, clearCart } from "./cartStore.service";
import { deleteAddress, findAddressByKeyValue } from "../address.service";
import { postOrder } from "../order.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { computeCombinationPrice, getTaxRateForGroup } from "./pricing.service";
import { deleteCustomer, postCustomer } from "../customer.service";
import { postAddress } from "../address.service";
import {
  getGuestSession,
  saveCustomerSession,
  clearGuestSession,
} from "./session.service";
import { putCart, getCartById } from "../cart.service";
import { postOrderHistory } from "../orderHistory.service";

const DEFAULT_CURRENCY_ID = 1;
const DEFAULT_CARRIER_ID = 2;
const DEFAULT_LANG_ID = 1;
const DEFAULT_SHOP_ID = 1;
const DEFAULT_COUNTRY_ID = 8;
const ACTIVE_COUNTRY_IDS = new Set(["8", "21"]);
const DEFAULT_ORDER_STATE_ID = 11;
const DEFAULT_PAYMENT = "Paiement à la livraison";
const DEFAULT_MODULE = "ps_checkpayment";

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const formatDecimal = (value, decimals = 6) => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "0.000000";
  }
  return value.toFixed(decimals);
};

const resolveActiveCountryId = (idCountry) => {
  const normalized = String(idCountry ?? DEFAULT_COUNTRY_ID);
  return ACTIVE_COUNTRY_IDS.has(normalized)
    ? Number(normalized)
    : DEFAULT_COUNTRY_ID;
};

const resolveCartItems = async (items) => {
  const resolved = [];
  for (const item of items) {
    const products = await findProductByKeyValue("id", item.idProduct);
    if (!products.length) {
      throw new Error(`Produit introuvable (id=${item.idProduct}).`);
    }
    const product = products[0];

    let combination = null;
    if (item.idProductAttribute && String(item.idProductAttribute) !== "0") {
      const combos = await findCombinationsByProductId(product.id);
      combination = combos.find(
        (combo) => String(combo.id) === String(item.idProductAttribute)
      );
    }

    const taxRate =
      item.taxRate === null || item.taxRate === undefined
        ? await getTaxRateForGroup(product.idTaxRulesGroup)
        : Number(item.taxRate || 0);

    const { priceExcl, priceIncl } = computeCombinationPrice({
      basePrice: product.price,
      combinationPriceImpact: combination?.price ?? 0,
      taxRate,
    });

    resolved.push({
      product,
      combination,
      quantity: Number(item.quantity ?? 1),
      unitPriceHt: Number(priceExcl),
      unitPriceTtc: Number(priceIncl),
      taxRate,
    });
  }
  return resolved;
};

const computeTotals = (resolvedItems) => {
  const totalProductsHt = resolvedItems.reduce(
    (sum, item) => sum + item.unitPriceHt * item.quantity,
    0
  );
  const totalProductsTtc = resolvedItems.reduce(
    (sum, item) => sum + item.unitPriceTtc * item.quantity,
    0
  );
  const totalPaid = formatDecimal(totalProductsTtc);
  const totalPaidTaxExcl = formatDecimal(totalProductsHt);
  const paymentAmount = roundMoney(totalProductsTtc).toFixed(2);

  return {
    totals: {
      totalProducts: formatDecimal(totalProductsHt),
      totalProductsWt: formatDecimal(totalProductsTtc),
      totalPaid,
      totalPaidTaxIncl: totalPaid,
      totalPaidTaxExcl,
      totalPaidReal: "0.000000",
      totalShipping: "0.000000",
      totalShippingTaxIncl: "0.000000",
      totalShippingTaxExcl: "0.000000",
      totalDiscounts: "0.000000",
      totalDiscountsTaxIncl: "0.000000",
      totalDiscountsTaxExcl: "0.000000",
    },
    paymentAmount,
  };
};

// ─── Checkout Customer (logique inchangée) ────────────────────────────────

const checkoutAsCustomer = async ({ items, customer }) => {
  const cart = getCart();
  if (!cart.psCartId) {
    throw new Error("Le panier n'est pas encore prêt sur le serveur.");
  }

  const serverCart = await getCartById(cart.psCartId);
  if (!serverCart || !serverCart.id) {
    throw new Error("Panier serveur introuvable.");
  }

  const mustUpdateCarrier = !serverCart.idCarrier || serverCart.idCarrier == 0;
  if (mustUpdateCarrier) {
    const updated = await putCart(cart.psCartId, {
      ...serverCart,
      idCarrier: DEFAULT_CARRIER_ID,   // 2
    });
    if (!updated?.success) {
      throw new Error("Impossible de mettre à jour le transporteur du panier.");
    }
  }

  // 3. Adresse du client
  const addresses = await findAddressByKeyValue("id_customer", customer.id);
  const address = addresses?.[0];
  if (!address?.id) {
    throw new Error("Aucune adresse n'est liée à ce compte.");
  }

  // 4. Résoudre les articles et calculer les totaux
  const resolvedItems = await resolveCartItems(items);
  const { totals } = computeTotals(resolvedItems);

  const orderRows = resolvedItems.map((item) => ({
    productId: item.product.id,
    productAttributeId: item.combination?.id ?? 0,
    productQuantity: item.quantity,
    productName: item.product.name,
    productReference: item.product.reference,
    unitPriceTaxIncl: formatDecimal(item.unitPriceTtc),
    unitPriceTaxExcl: formatDecimal(item.unitPriceHt),
    totalPriceTaxIncl: formatDecimal(item.unitPriceTtc * item.quantity),
    totalPriceTaxExcl: formatDecimal(item.unitPriceHt * item.quantity),
    taxRate: formatDecimal(item.taxRate, 3),
  }));

  const orderPayload = {
    ...totals,
    idCart: cart.psCartId,
    idCustomer: customer.id,
    idAddressDelivery: address.id,
    idAddressInvoice: address.id,
    idCurrency: DEFAULT_CURRENCY_ID,
    idLang: customer.idLang ?? DEFAULT_LANG_ID,
    idShop: DEFAULT_SHOP_ID,
    idCarrier: DEFAULT_CARRIER_ID,
    currentState: 11,
    conversionRate: 1,
    secureKey: customer.secureKey,
    payment: DEFAULT_PAYMENT,
    module: DEFAULT_MODULE,
    valid: false,
    associations: { orderRows },
  };

  const createdOrder = await postOrder(orderPayload);
  if (!createdOrder?.success || !createdOrder?.id) {
    throw new Error(createdOrder?.error || "Création de la commande impossible.");
  }

  return {
    cartId: cart.psCartId,
    orderId: createdOrder.id,
    orderReference: createdOrder.reference,
    totalAmount: Number(totals.totalPaid),
  };
};
export const checkoutGuest = async ({ items, customerForm }) => {
  const cart = getCart();
  if (!cart.psCartId) {
    throw new Error(
      "Le panier n'est pas encore prêt sur le serveur. Réessayez dans un instant."
    );
  }

  let createdCustomerId = null;
  let createdAddressId = null;
  let cartLinkedToCustomer = false;

  try {
    // 1. Créer le client
    const createdCustomer = await postCustomer({
      firstname: customerForm.firstName,
      lastname: customerForm.lastName,
      email: customerForm.email,
      passwd: customerForm.password,
      idLang: DEFAULT_LANG_ID,
      idShopGroup: 1,
      idShop: DEFAULT_SHOP_ID,
      newsletter: false,
      optin: false,
      active: true,
      deleted: false,
      isGuest: false,
    });

    if (!createdCustomer?.success || !createdCustomer?.id) {
      throw new Error("Impossible de créer le compte client.");
    }
    createdCustomerId = createdCustomer.id;
    const secureKey = createdCustomer.secureKey;

    const createdAddress = await postAddress({
      idCustomer: createdCustomerId,
      alias: "Adresse principale",
      idState:    1,
      idCountry:   8,
      firstname: customerForm.firstName,
      lastname: customerForm.lastName,
      address1: customerForm.address1,
      city: customerForm.city,
      postcode: customerForm.postcode,
      idCountry: resolveActiveCountryId(customerForm.idCountry),
      phone: customerForm.phone ?? "0000000000",
    });

    if (!createdAddress?.success || !createdAddress?.id) {
      throw new Error("Impossible de créer l'adresse.");
    }
    createdAddressId = createdAddress.id;

    const serverCart = await getCartById(cart.psCartId);
    if (!serverCart || !serverCart.id) {
      throw new Error("Panier serveur introuvable.");
    }

    const updatedCart = {
      ...serverCart,
      idCustomer: createdCustomerId,
      idGuest: 0,
      secureKey: secureKey,
      idAddressDelivery: createdAddressId,
      idAddressInvoice: createdAddressId,
      idCarrier: serverCart.idCarrier || 2,
      associations: {
        ...serverCart.associations,
        cartRows: (serverCart.associations?.cartRows ?? []).map((row) => ({
          ...row,
          idAddressDelivery: createdAddressId,
        })),
      },
    };

    const cartUpdateResult = await putCart(cart.psCartId, updatedCart);
    if (!cartUpdateResult?.success) {
      throw new Error("Échec de la mise à jour du panier.");
    }
    cartLinkedToCustomer = true;

    saveCustomerSession({
      id: createdCustomerId,
      secureKey,
      email: customerForm.email,
      firstname: customerForm.firstName,
      lastname: customerForm.lastName,
      idLang: DEFAULT_LANG_ID,
    });

    clearGuestSession();

    // 7. Passer la commande
    const result = await checkoutAsCustomer({
      items,
      customer: {
        id: createdCustomerId,
        secureKey,
        idLang: DEFAULT_LANG_ID,
      },
    });

    return result;
  } catch (error) {
    if (!cartLinkedToCustomer && createdAddressId) {
      try {
        await deleteAddress(createdAddressId);
      } catch (deleteErr) {}
    }
    if (!cartLinkedToCustomer && createdCustomerId) {
      try {
        await deleteCustomer(createdCustomerId);
      } catch (deleteErr) {}
    }
    throw error;
  }
};

export const checkoutCart = async ({ items, customer, customerForm }) => {
  if (customer?.id) {
    return checkoutAsCustomer({ items, customer });
  }

  if (customerForm) {
    return checkoutGuest({ items, customerForm });
  }

  throw new Error(
    "Vous devez être connecté ou remplir le formulaire pour passer commande."
  );
};
