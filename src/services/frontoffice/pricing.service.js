import { findTaxRulesByGroupId } from "../taxRule.service";
import { findTaxByKeyValue } from "../tax.service";

const normalizeNumber = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const taxRateCache = new Map();

export const getTaxRateForGroup = async (groupId) => {
  if (!groupId) return 0;
  const cacheKey = String(groupId);
  if (taxRateCache.has(cacheKey)) return taxRateCache.get(cacheKey);

  const rules = await findTaxRulesByGroupId(groupId);
  const rule = rules?.[0];
  if (!rule?.taxId) {
    taxRateCache.set(cacheKey, 0);
    return 0;
  }
  const taxes = await findTaxByKeyValue("id", rule.taxId);
  const tax = taxes?.[0];
  const rate = normalizeNumber(tax?.rate ?? 0);
  taxRateCache.set(cacheKey, rate);
  return rate;
};

export const computePriceWithTax = (priceExcl, taxRate) => {
  const base = normalizeNumber(priceExcl);
  const rate = normalizeNumber(taxRate);
  const multiplier = 1 + rate / 100;
  return Number((base * multiplier).toFixed(2));
};

export const computeCombinationPrice = ({
  basePrice,
  combinationPriceImpact,
  taxRate,
}) => {
  const priceExcl = normalizeNumber(basePrice) + normalizeNumber(combinationPriceImpact);
  const priceIncl = computePriceWithTax(priceExcl, taxRate);
  return { priceExcl, priceIncl };
};
