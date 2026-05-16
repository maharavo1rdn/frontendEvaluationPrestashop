import { getCart } from "./cartStore.service";
import { findAddressByKeyValue } from "../address.service";
import { postOrder } from "../order.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { computeCombinationPrice, getTaxRateForGroup } from "./pricing.service";
import { putCart, getCartById } from "../cart.service";
import { findStockAvailableByProductAttribute } from "../stockAvailable.service";
import { createStockAdjustmentMovement } from "../stockMovement.service";

const DEFAULT_CURRENCY_ID = 1;
const DEFAULT_CARRIER_ID = 2;
const DEFAULT_LANG_ID = 1;
const DEFAULT_SHOP_ID = 1;
const DEFAULT_PAYMENT = "Paiement à la livraison";
const DEFAULT_MODULE = "ps_checkpayment";

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const formatDecimal = (value, decimals = 6) => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "0.000000";
  }
  return value.toFixed(decimals);
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

const checkoutAsCustomer = async ({ items, customer }) => {
  const cart = getCart();
  if (!cart.psCartId) {
    throw new Error("Le panier n'est pas encore prêt sur le serveur.");
  }

  const serverCart = await getCartById(cart.psCartId);
  if (!serverCart || !serverCart.id) {
    throw new Error("Panier serveur introuvable.");
  }

  const addresses = await findAddressByKeyValue("id_customer", customer.id);
  const address = addresses?.[0];
  if (!address?.id) {
    throw new Error("Aucune adresse n'est liée à ce compte.");
  }

  const cartRows = serverCart.associations?.cartRows ?? [];
  const mustUpdateCart =
    String(serverCart.idCustomer ?? 0) !== String(customer.id) ||
    String(serverCart.idGuest ?? 0) !== "0" ||
    String(serverCart.idAddressDelivery ?? 0) !== String(address.id) ||
    String(serverCart.idAddressInvoice ?? 0) !== String(address.id) ||
    !serverCart.idCarrier ||
    String(serverCart.idCarrier) === "0" ||
    cartRows.some(
      (row) => String(row.idAddressDelivery ?? 0) !== String(address.id)
    );

  if (mustUpdateCart) {
    const updatedCartPayload = {
      ...serverCart,
      idCustomer: customer.id,
      idGuest: 0,
      secureKey: customer.secureKey,
      idAddressDelivery: address.id,
      idAddressInvoice: address.id,
      idCarrier: serverCart.idCarrier || DEFAULT_CARRIER_ID,
      associations: {
        ...serverCart.associations,
        cartRows: cartRows.map((row) => ({
          ...row,
          idAddressDelivery: address.id,
        })),
      },
    };
    const updated = await putCart(cart.psCartId, updatedCartPayload);
    if (!updated?.success) {
      throw new Error("Impossible de mettre à jour le panier.");
    }
  }

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
    throw new Error(
      createdOrder?.error || "Création de la commande impossible."
    );
  }

  for (const item of resolvedItems) {
    try {
      const stockEntries = await findStockAvailableByProductAttribute(
        item.product.id,
        item.combination?.id ?? 0
      );
      const stockId = stockEntries?.[0]?.id;
      if (stockId) {
        await createStockAdjustmentMovement({
          idProduct: item.product.id,
          idProductAttribute: item.combination?.id ?? 0,
          idStock: stockId,
          deltaQuantity: -item.quantity,
          dateAdd: new Date(),
        });
      }
    } catch (movementErr) {
      console.warn(
        `Échec mouvement de stock pour le produit ${item.product.id}:`,
        movementErr
      );
    }
  }

  return {
    cartId: cart.psCartId,
    orderId: createdOrder.id,
    orderReference: createdOrder.reference,
    totalAmount: Number(totals.totalPaid),
  };
};

export const checkoutCart = async ({ items, customer }) => {
  if (!customer?.id) {
    throw new Error("Vous devez être connecté pour passer commande.");
  }
  return checkoutAsCustomer({ items, customer });
};