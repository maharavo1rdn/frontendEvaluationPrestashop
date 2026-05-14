import { getCart, clearCart } from "./cartStore.service";
import { findAddressByKeyValue } from "../address.service";
import { postCart } from "../cart.service";
import { postOrder, putOrder } from "../order.service";
import { postOrderDetail } from "../orderDetail.service";
import { postOrderHistory } from "../orderHistory.service";
import { postOrderPayment } from "../orderPayment.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { findOrderStateByKeyValue } from "../orderState.service";
import { computeCombinationPrice, getTaxRateForGroup } from "./pricing.service";

const DEFAULT_CURRENCY_ID = 1;
const DEFAULT_CARRIER_ID = 2;
const DEFAULT_LANG_ID = 1;
const DEFAULT_SHOP_ID = 1;
const DEFAULT_ORDER_STATE_ID = 11; // 11 = En attente paiement à la livraison
const DEFAULT_PAYMENT = "Paiement à la livraison";
const DEFAULT_MODULE = "ps_checkpayment";
const DEFAULT_ORDER_STATE_MODULE = "ps_checkpayment";
const DEFAULT_ORDER_STATE_NAMES = [
  "En attente paiement a la livraison",
  "En attente paiement à la livraison",
  "Paiement a la livraison",
  "Paiement à la livraison",
  "Awaiting Cash on Delivery",
];

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

const resolveDefaultOrderStateId = async () => {
  return DEFAULT_ORDER_STATE_ID;
};

export const checkoutCart = async ({ items, customer }) => {
  if (!customer?.id) {
    throw new Error("Vous devez etre connecte pour passer commande.");
  }
  const cart = getCart();
  if (!cart.psCartId) {
    throw new Error("Le panier n'est pas encore prêt sur le serveur. Réessayez dans un instant.");
  }

  const addresses = await findAddressByKeyValue("id_customer", customer.id);
  const address = addresses?.[0];

  if (!address?.id) {
    throw new Error("Aucune adresse n'est liee a ce compte.");
  }

  const resolvedItems = await resolveCartItems(items);
  const { totals, paymentAmount } = computeTotals(resolvedItems);

  const orderStateId = await resolveDefaultOrderStateId();

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
    idCustomer: customer.id,
    idCarrier: DEFAULT_CARRIER_ID,
    currentState: orderStateId,
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
      createdOrder?.error || "Creation de la commande impossible."
    );
  }

  // Historique APRÈS le paiement
  // await postOrderHistory({
  //   idOrder: createdOrder.id,
  //   idOrderState: orderStateId,
  //   idEmployee: 0,
  // });

  return {
    cartId: cart.psCartId,
    orderId: createdOrder.id,
    orderReference: createdOrder.reference,
    totalAmount: Number(totals.totalPaid),
  };
};
