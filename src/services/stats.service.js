import { getAll } from "./order.service";
import { getOrderById } from "./order.service";
import { getUnorderedCarts } from "./cart.service";
import { findProductByKeyValue } from "./product.service";
import { findCombinationsByProductId } from "./combination.service";
import {
  getTaxRateForGroup,
  computeCombinationPrice,
} from "./frontoffice/pricing.service";

// Cache local pour une exécution de getDashboardStats
const makeCache = () => {
  const products = new Map();
  const combinations = new Map();
  const taxRates = new Map();

  const getProduct = async (id) => {
    if (products.has(id)) return products.get(id);
    const list = await findProductByKeyValue("id", id);
    const product = list?.[0] ?? null;
    products.set(id, product);
    return product;
  };

  const getCombinations = async (productId) => {
    if (combinations.has(productId)) return combinations.get(productId);
    const combos = await findCombinationsByProductId(productId).catch(() => []);
    combinations.set(productId, combos);
    return combos;
  };

  const getTaxRate = async (groupId) => {
    if (taxRates.has(groupId)) return taxRates.get(groupId);
    const rate = await getTaxRateForGroup(groupId).catch(() => 0);
    taxRates.set(groupId, rate);
    return rate;
  };

  return { getProduct, getCombinations, getTaxRate };
};

// Calcule HT + TTC en une seule passe
const computeCartTotals = async (cart, cache) => {
  const rows = cart.associations?.cartRows ?? [];
  let totalTTC = 0;
  let totalHT = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        const product = await cache.getProduct(row.idProduct);
        if (!product) return;

        let combination = null;
        if (row.idProductAttribute && String(row.idProductAttribute) !== "0") {
          const combos = await cache.getCombinations(product.id);
          combination = combos.find(
            (c) => String(c.id) === String(row.idProductAttribute)
          );
        }

        const taxRate = await cache.getTaxRate(product.idTaxRulesGroup);
        const { priceIncl, priceExcl } = computeCombinationPrice({
          basePrice: product.price ?? 0,
          combinationPriceImpact: combination?.price ?? 0,
          taxRate,
        });

        const qty = Number(row.quantity ?? 1);
        totalTTC += Number(priceIncl) * qty;
        totalHT += Number(priceExcl) * qty;
      } catch {}
    })
  );

  return { totalTTC, totalHT };
};

export const getDashboardStats = async () => {
  const cache = makeCache();
  const orders = await getAll();

  const dailyStats = {};
  let globalTotalOrdered = 0;
  let globalTotalReceived = 0;
  let globalTotalHT = 0;
  let globalTotalTTC = 0;
  let paidOrdersTTC = 0;
  let totalWholesaleCost = 0;

  for (const order of orders) {
    const dateKey = order.dateAdd?.split(" ")[0] ?? "Inconnue";
    const orderTTC = parseFloat(order.totalPaid) || 0;
    const orderHT = parseFloat(order.totalProducts) || 0;
    const isPaid = order.valid === true || order.valid === "1";

    globalTotalOrdered += orderTTC;
    globalTotalTTC += orderTTC;
    globalTotalHT += orderHT;
    if (isPaid) {
      globalTotalReceived += orderTTC;
      paidOrdersTTC += orderTTC;
    }

    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { date: dateKey, count: 0, ordered: 0, received: 0 };
    }
    dailyStats[dateKey].count += 1;
    dailyStats[dateKey].ordered += orderTTC;
    dailyStats[dateKey].received += isPaid ? orderTTC : 0;
  }

  // 2. Récupérer TOUTES les commandes payées en parallèle
  const paidOrders = orders.filter(
    (o) => o.valid === true || o.valid === "1"
  );

  const wholesaleCosts = await Promise.all(
    paidOrders.map(async (order) => {
      try {
        const fullOrder = await getOrderById(order.id);
        const rows = fullOrder?.associations?.orderRows ?? [];

        const rowCosts = await Promise.all(
          rows.map(async (row) => {
            try {
              const product = await cache.getProduct(row.productId);
              if (!product) return 0;
              const wholesalePrice = Number(
                product.wholesalePrice || product.wholesale_price || 0
              );
              return wholesalePrice * Number(row.productQuantity || 0);
            } catch {
              return 0;
            }
          })
        );

        return rowCosts.reduce((sum, c) => sum + c, 0);
      } catch (err) {
        console.warn(`Impossible de récupérer la commande ${order.id}`, err);
        return 0;
      }
    })
  );

  totalWholesaleCost = wholesaleCosts.reduce((sum, c) => sum + c, 0);

  // 3. Paniers en parallèle, une seule passe HT+TTC
  const unorderedCarts = await getUnorderedCarts();
  const cartResults = await Promise.all(
    unorderedCarts.map((cart) => computeCartTotals(cart, cache))
  );

  const unorderedCartsTotalTTC = cartResults.reduce((s, r) => s + r.totalTTC, 0);
  const unorderedCartsTotalHT = cartResults.reduce((s, r) => s + r.totalHT, 0);

  const sortedDaily = Object.values(dailyStats).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return {
    globalTotalOrdered,
    globalTotalReceived,
    totalOrdersCount: orders.length,
    globalTotalHT,
    globalTotalTTC,
    daily: sortedDaily,
    unorderedCartsCount: unorderedCarts.length,
    unorderedCartsTotalHT,
    unorderedCartsTotalTTC,
    profit: globalTotalHT - totalWholesaleCost,
  };
};