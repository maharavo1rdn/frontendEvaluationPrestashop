import { resetCustomers } from "./customer.service";
import { resetOrders } from "./order.service";
import { resetCarts } from "./cart.service";
import { resetOrderDetails } from "./orderDetail.service";
import { resetOrderPayments } from "./orderPayment.service";
import { resetProducts } from "./product.service";
import { resetProductFeatureValues } from "./productFeatureValue.service";
import { resetCategories } from "./category.service";
import { resetCombinations } from "./combination.service";
import { resetTaxRules } from "./taxRule.service";
import { resetTaxRulesGroups } from "./taxRulesGroup.service";
import { resetTaxes } from "./tax.service";
const TABLE_RESETTERS = [
  { id: "customers", reset: resetCustomers },
  { id: "orders", reset: resetOrders },
  { id: "order-details", reset: resetOrderDetails },
  { id: "order-payments", reset: resetOrderPayments },
  { id: "feature-values", reset: resetProductFeatureValues },
  { id: "carts", reset: resetCarts },
  { id: "combinations", reset: resetCombinations },
  { id: "products", reset: resetProducts },
  { id: "categories", reset: resetCategories },
  { id: "tax-rules", reset: resetTaxRules },
  { id: "tax-rule-groups", reset: resetTaxRulesGroups },
  { id: "taxes", reset: resetTaxes },
];

export const resetAllTables = async () => {
  for (const table of TABLE_RESETTERS) {
    await table.reset();
  }
};
