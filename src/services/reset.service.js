import { resetCustomers } from "./customer.service";
import { resetOrders } from "./order.service";
import { resetCarts } from "./cart.service";
import { resetOrderDetails } from "./orderDetail.service";
import { resetOrderPayments } from "./orderPayment.service";
import { resetProducts } from "./product.service";
import { resetStockAvailables } from "./stockAvailable.service";
const TABLE_RESETTERS = [
  { id: "customers", reset: resetCustomers },
  { id: "orders", reset: resetOrders },
  { id: "order-details", reset: resetOrderDetails },
  { id: "order-payments", reset: resetOrderPayments },
  { id: "stocks", reset: resetStockAvailables },
  { id: "products", reset: resetProducts },
  { id: "carts", reset: resetCarts },
];

export const resetAllTables = async () => {
  for (const table of TABLE_RESETTERS) {
    await table.reset();
  }
};
