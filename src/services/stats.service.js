import { getAll } from "./order.service";
import { getUnorderedCarts } from "./cart.service";
import { findProductByKeyValue } from "./product.service";
import { findCombinationsByProductId } from "./combination.service";
import {
  getTaxRateForGroup,
  computeCombinationPrice,
} from "./frontoffice/pricing.service";

const computeCartTotal = async (cart) => {
  const rows = cart.associations?.cartRows ?? [];
  let total = 0;

  for (const row of rows) {
    try {
      const products = await findProductByKeyValue("id", row.idProduct);
      const product = products?.[0];
      if (!product) continue;

      let combination = null;
      if (row.idProductAttribute && String(row.idProductAttribute) !== "0") {
        const combos = await findCombinationsByProductId(product.id).catch(
          () => []
        );
        combination = combos.find(
          (c) => String(c.id) === String(row.idProductAttribute)
        );
      }

      const taxRate = await getTaxRateForGroup(product.idTaxRulesGroup).catch(
        () => 0
      );
      const { priceIncl } = computeCombinationPrice({
        basePrice: product.price ?? 0,
        combinationPriceImpact: combination?.price ?? 0,
        taxRate,
      });

      total += Number(priceIncl) * Number(row.quantity ?? 1);
    } catch {
    }
  }

  return total;
};

export const getDashboardStats = async () => {
  const orders = await getAll();

  const dailyStats = {};
  let globalTotalOrdered = 0;
  let globalTotalReceived = 0;
  const totalOrdersCount = orders.length;

  orders.forEach((order) => {
    const dateKey = order.dateAdd ? order.dateAdd.split(" ")[0] : "Inconnue";

    // if (!order.valid)
    //   continue;
    const amount = parseFloat(order.totalPaid) || 0;
    globalTotalOrdered += amount;

    const isPaid = order.valid === true || order.valid === "1";
    const receivedAmount = isPaid ? amount : 0;

    globalTotalReceived += receivedAmount;

    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = {
        date: dateKey,
        count: 0,
        ordered: 0,
        received: 0,
      };
    }

    dailyStats[dateKey].count += 1;
    dailyStats[dateKey].ordered += amount;
    dailyStats[dateKey].received += receivedAmount;
  });

  const sortedDaily = Object.values(dailyStats).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const unorderedCarts = await getUnorderedCarts();
  const cartTotals = await Promise.all(unorderedCarts.map(computeCartTotal));
  const unorderedCartsTotal = cartTotals.reduce((sum, t) => sum + t, 0);

  return {
    globalTotalOrdered,
    globalTotalReceived,
    totalOrdersCount,
    daily: sortedDaily,
    unorderedCartsCount: unorderedCarts.length,
    unorderedCartsTotal,
  };
};
