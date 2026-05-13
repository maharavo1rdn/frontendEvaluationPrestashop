import { findAddressByKeyValue } from "../address.service";
import { postCart } from "../cart.service";
import { postOrder, putOrder } from "../order.service";
import { postOrderDetail } from "../orderDetail.service";
import { postOrderHistory } from "../orderHistory.service";
import { postOrderPayment } from "../orderPayment.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { computeCombinationPrice, getTaxRateForGroup } from "./pricing.service";

const DEFAULT_CURRENCY_ID = 1;
const DEFAULT_CARRIER_ID = 2;
const DEFAULT_LANG_ID = 1;
const DEFAULT_ORDER_STATE_ID = 8; // 8 = En attente paiement à la livraison
const DEFAULT_PAYMENT = "Paiement à la livraison";
const DEFAULT_MODULE = "ps_cashondelivery";

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
        (combo) => String(combo.id) === String(item.idProductAttribute),
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
    0,
  );
  const totalProductsTtc = resolvedItems.reduce(
    (sum, item) => sum + item.unitPriceTtc * item.quantity,
    0,
  );

  const totalPaidRounded = String(roundMoney(totalProductsTtc));

  return {
    totalProducts: formatDecimal(totalProductsHt),
    totalProductsWt: formatDecimal(totalProductsTtc),
    totalPaid: totalPaidRounded,
    totalPaidTaxIncl: totalPaidRounded,
    totalPaidTaxExcl: totalPaidRounded,
    totalPaidReal: totalPaidRounded,
    totalShipping: "0.000000",
    totalShippingTaxIncl: "0.000000",
    totalShippingTaxExcl: "0.000000",
    totalDiscounts: "0.000000",
    totalDiscountsTaxIncl: "0.000000",
    totalDiscountsTaxExcl: "0.000000",
  };
};

export const checkoutCart = async ({ items, customer }) => {
  if (!customer?.id) {
    throw new Error("Vous devez etre connecte pour passer commande.");
  }

  const addresses = await findAddressByKeyValue("id_customer", customer.id);
  const address = addresses?.[0];

  if (!address?.id) {
    throw new Error("Aucune adresse n'est liee a ce compte.");
  }

  const resolvedItems = await resolveCartItems(items);
  const totals = computeTotals(resolvedItems);

  const cartPayload = {
    idAddressDelivery: address.id,
    idAddressInvoice: address.id,
    idCurrency: DEFAULT_CURRENCY_ID,
    idCarrier: DEFAULT_CARRIER_ID,
    idCustomer: customer.id,
    idLang: customer.idLang ?? DEFAULT_LANG_ID,
    secureKey: customer.secureKey,
    associations: {
      cartRows: resolvedItems.map((item) => ({
        idProduct: item.product.id,
        idProductAttribute: item.combination?.id ?? 0,
        idAddressDelivery: address.id,
        quantity: item.quantity,
      })),
    },
  };

  const createdCart = await postCart(cartPayload);
  if (!createdCart?.success || !createdCart?.id) {
    throw new Error(createdCart?.error || "Creation du panier impossible.");
  }

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
    idAddressDelivery: address.id,
    idAddressInvoice: address.id,
    idCart: createdCart.id,
    idCurrency: DEFAULT_CURRENCY_ID,
    idLang: customer.idLang ?? DEFAULT_LANG_ID,
    idCustomer: customer.id,
    idCarrier: DEFAULT_CARRIER_ID,
    currentState: DEFAULT_ORDER_STATE_ID,
    conversionRate: 1,
    secureKey: customer.secureKey,
    payment: DEFAULT_PAYMENT,
    module: DEFAULT_MODULE,
    valid: false,
    ...totals,
    associations: { orderRows },
  };
  const createdOrder = await postOrder(orderPayload);
  console.log("Created order:", createdOrder);
  
  if (!createdOrder?.success || !createdOrder?.id) {
    throw new Error(createdOrder?.error || "Creation de la commande impossible.");
  }

  // FORCE THE TOTALS: PrestaShop's POST /orders recalculates totals and drops our overrides.
  // We must execute a PUT /orders/{id} immediately after to force the exact computed totals.
  // const forcedOrder = await putOrder(createdOrder.id, orderPayload);
  // if (!forcedOrder?.success) {
  //   console.warn("Erreur lors du forcage des totaux (PUT):", forcedOrder.error);
  // }

  // Paiement manuel AVANT l'historique pour satisfaire hasBeenPaid()
  if (createdOrder?.reference) {
    await postOrderPayment({
      orderReference: createdOrder.reference,
      idCurrency: DEFAULT_CURRENCY_ID,
      amount: totals.totalPaid,
      paymentMethod: DEFAULT_PAYMENT,
    });
  }

  // Historique APRÈS le paiement
  await postOrderHistory({
    idOrder: createdOrder.id,
    idOrderState: DEFAULT_ORDER_STATE_ID,
    idEmployee: 0,
  });

  return {
    cartId: createdCart.id,
    orderId: createdOrder.id,
    orderReference: createdOrder.reference,
    totalAmount: Number(totals.totalPaid),
  };
};
