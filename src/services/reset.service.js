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
import { resetProductOptions } from "./productOption.service";
import { resetProductOptionValues } from "./productOptionValue.service";
import { resetStockAvailables } from "./stockAvailable.service";
import { resetAddresses } from "./address.service";
const TABLE_RESETTERS = [
  { id: "order-payments", reset: resetOrderPayments },
  { id: "order-details", reset: resetOrderDetails },
  { id: "orders", reset: resetOrders },
  { id: "carts", reset: resetCarts },
  { id: "addresses", reset: resetAddresses },
  { id: "customers", reset: resetCustomers },
  { id: "combinations", reset: resetCombinations },
  { id: "product-option-values", reset: resetProductOptionValues },
  { id: "product-options", reset: resetProductOptions },
  { id: "feature-values", reset: resetProductFeatureValues },
  { id: "products", reset: resetProducts },
  // { id: "stock-availables", reset: resetStockAvailables },
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
