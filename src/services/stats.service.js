import { getAll } from "./order.service";

export const getDashboardStats = async () => {
  const orders = await getAll();

  const dailyStats = {};
  let globalTotalOrdered = 0;
  let globalTotalReceived = 0;
  let totalOrdersCount = orders.length;
  
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

  return {
    globalTotalOrdered,
    globalTotalReceived,
    totalOrdersCount,
    daily: sortedDaily,
  };
};
