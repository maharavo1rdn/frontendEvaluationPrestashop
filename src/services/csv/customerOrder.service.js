import { parseCSVFile } from "./csv.service";
import { findCustomerByKeyValue, postCustomer } from "../customer.service";
import { findAddressByKeyValue, postAddress } from "../address.service";
import { postCart } from "../cart.service";
import { postOrder, getOrderById, putOrder } from "../order.service";
import { postOrderPayment } from "../orderPayment.service";
import { postOrderHistory } from "../orderHistory.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { findProductOptionValueByKeyValue } from "../productOptionValue.service";
import { findTaxRulesByGroupId } from "../taxRule.service";
import { findTaxByKeyValue } from "../tax.service";
import { parseDate as parseCSVDate, parseNumber } from "../../utils/utils";
import { findStockAvailableByProductAttribute } from "../stockAvailable.service";
import { createStockAdjustmentMovement } from "../stockMovement.service";
import { postOrderTransition } from "../stockTransition.service";
import { parseDate } from "../../utils/utils";
// ─── Constantes ───────────────────────────────────────────────────────────────

const ORDER_STATE_MAP = {
  "paiement accepté": 11,
  "en attente paiement à la livraison": 8,
  "erreur de paiement": 6,
  annulé: 6,
  livré: 5,
  expédié: 4,
  "en cours de préparation": 3,
  "en attente de virement": 10,
};

const PAYMENT_INFO_MAP = {
  2: { payment: "Virement bancaire", module: "ps_checkpayment" },
  8: { payment: "Paiement à la livraison", module: "ps_cashondelivery" },
  6: { payment: "Virement bancaire", module: "ps_checkpayment" },
  5: { payment: "Paiement à la livraison", module: "ps_cashondelivery" },
  4: { payment: "Virement bancaire", module: "ps_checkpayment" },
  3: { payment: "Virement bancaire", module: "ps_checkpayment" },
  10: { payment: "Virement bancaire", module: "ps_checkpayment" },
};

const DEFAULTS = {
  idCarrier: 2,
  idCurrency: 1,
  idLang: 1,
  idCountry: 8,
  idEmployee: 0,
  conversionRate: 1,
  idShop: 1,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDateTime = (value) => {
  const date = parseCSVDate(value);
  return date ? `${date} 00:00:00` : undefined;
};

const parseName = (nom) => {
  if (!nom?.trim()) return { firstname: "Inconnu", lastname: "-" };
  const parts = nom.trim().split(/\s+/);
  return {
    firstname: parts[0],
    lastname: parts.length > 1 ? parts.slice(1).join(" ") : "-",
  };
};

const parseAchatColumn = (raw) => {
  if (!raw?.trim()) return [];

  const cleaned = raw
    .trim()
    .slice(1, -1)
    .replace(/""([^"]+)""/g, '"$1"'); // ← seulement ""valeur"", pas "" seul

  const items = [];
  const tupleRegex = /\("([^"]*)";"?([^";)]+)"?;"([^"]*)"\)/g;

  let match;
  while ((match = tupleRegex.exec(cleaned)) !== null) {
    items.push({
      reference: match[1],
      quantity: parseInt(parseNumber(match[2])),
      karazany: match[3] || null,
    });
  }
  return items;
};

const resolveOrderStateId = (etat) => {
  if (!etat) return 1;
  const key = etat.trim().toLowerCase();
  for (const [label, id] of Object.entries(ORDER_STATE_MAP)) {
    if (label.toLowerCase() === key) return id;
  }
  return 1;
};

const getPaymentInfo = (idOrderState) =>
  PAYMENT_INFO_MAP[idOrderState] ?? {
    payment: "Virement bancaire",
    module: "ps_wirepayment",
  };

const generateSecureKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const roundMoney = (value) => {
  if (!Number.isFinite(value)) return "0.000000";
  return value.toFixed(6);
};

// ─── Cache TVA ────────────────────────────────────────────────────────────────

const taxRateCache = new Map();

const getTaxRateByGroupId = async (groupId) => {
  if (!groupId) return 0;
  const key = String(groupId);
  if (taxRateCache.has(key)) return taxRateCache.get(key);

  const rules = await findTaxRulesByGroupId(groupId);
  const taxId = rules[0]?.taxId;
  if (!taxId) {
    taxRateCache.set(key, 0);
    return 0;
  }

  const taxes = await findTaxByKeyValue("id", taxId);
  const rate = Number(taxes[0]?.rate) || 0;
  taxRateCache.set(key, rate);
  return rate;
};

// ─── Résolution produits ──────────────────────────────────────────────────────

const normalizeIds = (ids) => ids.map((id) => String(id)).sort();

const findCombinationByValueName = async (productId, valueName, caches) => {
  let optionValue = caches?.optionValueByName?.get(valueName);
  if (!optionValue) {
    const optionValues = await findProductOptionValueByKeyValue(
      "name",
      valueName
    );
    if (!optionValues.length)
      throw new Error(`Valeur d'attribut "${valueName}" introuvable`);
    optionValue = optionValues[0];
    caches?.optionValueByName?.set(valueName, optionValue);
  }

  const targetId = String(optionValue.id);
  let combinations = caches?.combinationsByProductId?.get(productId);
  if (!combinations) {
    combinations = await findCombinationsByProductId(productId);
    caches?.combinationsByProductId?.set(productId, combinations);
  }
  const combination = combinations.find((c) =>
    normalizeIds(c?.associations?.productOptionValues ?? []).includes(targetId)
  );

  if (!combination)
    throw new Error(
      `Aucune combinaison avec l'attribut "${valueName}" pour produit id=${productId}`
    );

  return combination;
};

const resolveAchatItems = async (items, caches) => {
  const resolved = [];

  for (const item of items) {
    let product = caches?.productByReference?.get(item.reference);
    if (!product) {
      const products = await findProductByKeyValue(
        "reference",
        item.reference
      );
      if (!products.length)
        throw new Error(`Produit "${item.reference}" introuvable`);
      product = products[0];
      caches?.productByReference?.set(item.reference, product);
    }
    const taxRate = await getTaxRateByGroupId(product.idTaxRulesGroup);
    let combination = null;
    let unitPriceHt = Number(product.price) || 0;

    if (item.karazany) {
      combination = await findCombinationByValueName(
        product.id,
        item.karazany,
        caches
      );
      unitPriceHt += Number(combination.price) || 0;
    }

    const unitPriceTtc = unitPriceHt * (1 + taxRate / 100);

    resolved.push({
      product,
      combination,
      quantity: item.quantity,
      unitPriceHt,
      unitPriceTtc,
      taxRate,
      reference: item.reference,
      karazany: item.karazany,
    });
  }

  return resolved;
};

const computeOrderTotals = (resolvedItems) => {
  const totalHt = resolvedItems.reduce(
    (s, i) => s + i.unitPriceHt * i.quantity,
    0
  );
  const totalTtc = resolvedItems.reduce(
    (s, i) => s + i.unitPriceTtc * i.quantity,
    0
  );

  return {
    totalProducts: roundMoney(totalHt),
    totalProductsWt: roundMoney(totalTtc),
    totalPaid: roundMoney(totalTtc),
    totalPaidTaxIncl: roundMoney(totalTtc),
    totalPaidTaxExcl: roundMoney(totalHt),
    totalPaidReal: "0.000000", // Forcé à 0 pour la création
    totalShipping: "0.000000",
    totalShippingTaxIncl: "0.000000",
    totalShippingTaxExcl: "0.000000",
    totalDiscounts: "0.000000",
    totalDiscountsTaxIncl: "0.000000",
    totalDiscountsTaxExcl: "0.000000",
  };
};

// ─── Find or create ───────────────────────────────────────────────────────────

const ensureCustomer = async (row, caches) => {
  const cached = caches?.customerByEmail?.get(row.email);
  if (cached) return cached;

  const existing = await findCustomerByKeyValue("email", row.email);
  if (existing.length > 0) {
    caches?.customerByEmail?.set(row.email, existing[0]);
    return existing[0];
  }

  const { firstname, lastname } = parseName(row.nom);
  const created = await postCustomer({
    firstname,
    lastname,
    email: row.email,
    passwd: row.pwd,
    active: true,
  });
  if (!created.success) {
    const retryExisting = await findCustomerByKeyValue("email", row.email);
    if (retryExisting.length > 0) {
      caches?.customerByEmail?.set(row.email, retryExisting[0]);
      return retryExisting[0];
    }
    throw new Error(
      `Impossible de créer le client "${row.email}": ${created.error}`
    );
  }

  let secureKey = created.secureKey;
  if (!secureKey && created.id) {
    const retry = await findCustomerByKeyValue("id", created.id);
    secureKey = retry[0]?.secureKey;
  }
  const customer = {
    id: created.id,
    firstname,
    lastname,
    email: row.email,
    secureKey,
  };
  caches?.customerByEmail?.set(row.email, customer);
  return customer;
};

const ensureAddress = async (customerId, row, caches) => {
  const addressKey = `${customerId}::${row.adresse?.trim().toLowerCase()}`;
  const cached = caches?.addressByKey?.get(addressKey);
  if (cached) return cached;

  const all = await findAddressByKeyValue("id_customer", customerId);
  const existing = all.find(
    (a) =>
      a.address1?.trim().toLowerCase() === row.adresse?.trim().toLowerCase()
  );
  if (existing) {
    caches?.addressByKey?.set(addressKey, existing);
    return existing;
  }

  const { firstname, lastname } = parseName(row.nom);
  const created = await postAddress({
    idCustomer: customerId,
    idCountry: DEFAULTS.idCountry,
    idState: 1,
    alias: "import",
    firstname,
    lastname,
    address1: row.adresse,
    city: row.adresse,
  });
  if (!created.success) {
    const retryAll = await findAddressByKeyValue("id_customer", customerId);
    const retryExisting = retryAll.find(
      (a) =>
        a.address1?.trim().toLowerCase() === row.adresse?.trim().toLowerCase()
    );
    if (retryExisting) {
      caches?.addressByKey?.set(addressKey, retryExisting);
      return retryExisting;
    }
    throw new Error(
      `Impossible de créer l'adresse "${row.adresse}": ${created.error}`
    );
  }
  const address = { id: created.id };
  caches?.addressByKey?.set(addressKey, address);
  return address;
};

const createCart = async (customerId, addressId, resolvedItems, dateAdd) => {
  const cartRows = resolvedItems.map((item) => ({
    idProduct: item.product.id,
    idProductAttribute: item.combination?.id ?? 0,
    idAddressDelivery: addressId,
    quantity: item.quantity,
  }));
  const created = await postCart({
    idCustomer: customerId,
    idAddressDelivery: addressId,
    idAddressInvoice: addressId,
    idCurrency: DEFAULTS.idCurrency,
    idCarrier: DEFAULTS.idCarrier,
    idShop: DEFAULTS.idShop,
    dateAdd: dateAdd,
    associations: { cartRows },
  });
  if (!created.success)
    throw new Error(`Impossible de créer le panier: ${created.error}`);
  return { id: created.id };
};

const createOrder = async ({
  cartId,
  customerId,
  addressId,
  dateAdd,
  totals,
  resolvedItems,
  paymentInfo,
  idOrderState,
  secureKey,
}) => {
  const orderRows = resolvedItems.map((item) => ({
    productId: item.product.id,
    productAttributeId: item.combination?.id ?? 0,
    productQuantity: item.quantity,
    productName: item.product.name ?? item.reference,
    productReference: item.reference,
    unitPriceTaxIncl: roundMoney(item.unitPriceTtc),
    unitPriceTaxExcl: roundMoney(item.unitPriceHt),
    totalPriceTaxIncl: roundMoney(item.unitPriceTtc * item.quantity),
    totalPriceTaxExcl: roundMoney(item.unitPriceHt * item.quantity),
    taxRate: item.taxRate.toFixed(3),
  }));

  const orderPayload = {
    ...totals,
    idCart: cartId,
    idCustomer: customerId,
    idAddressDelivery: addressId,
    idAddressInvoice: addressId,
    idCurrency: DEFAULTS.idCurrency,
    idCarrier: DEFAULTS.idCarrier,
    idShop: DEFAULTS.idShop,
    conversionRate: DEFAULTS.conversionRate,
    secureKey: secureKey || generateSecureKey(),
    payment: paymentInfo.payment,
    module: paymentInfo.module, // ← plus de hardcode
    dateAdd,
    // PS auto-crée order_payment au POST — ne pas appeler postOrderPayment manuellement
    // État final directement → pas de createOrderHistory → pas de hooks → pas de doublon
    currentState: idOrderState, // ← plus de hardcode à 10
    valid: idOrderState === 2, // ← valid=1 seulement pour paiement accepté
    associations: { orderRows },
  };

  const created = await postOrder(orderPayload);

  if (!created.success || !created.id)
    throw new Error(`Impossible de créer la commande: ${created.error}`);

  // Les totaux sont désormais calculés correctement par PrestaShop grâce au idState=1
  // Plus besoin du putOrder qui risquait d'écraser la référence générée.

  // On renvoie l'ID et la référence (vérifie ton order.service.js)
  return { id: created.id, reference: created.reference };
};

const createOrderPayment = async ({
  orderReference,
  amount,
  paymentMethod,
  dateAdd,
}) => {
  if (!orderReference)
    throw new Error("Référence de commande manquante pour le paiement");

  const created = await postOrderPayment({
    orderReference,
    idCurrency: DEFAULTS.idCurrency,
    amount: amount,
    paymentMethod: paymentMethod,
    conversionRate: DEFAULTS.conversionRate,
    dateAdd,
  });
  if (!created.success)
    throw new Error(`Impossible de créer le paiement: ${created.error}`);
  return { id: created.id };
};

const createOrderHistory = async (orderId, idOrderState, dateAdd) => {
  const created = await postOrderHistory({
    idOrder: orderId,
    idOrderState,
    idEmployee: DEFAULTS.idEmployee,
    dateAdd,
  });
  if (!created.success)
    throw new Error(`Impossible de créer l'historique: ${created.error}`);
  return { id: created.id };
};

export const importOrdersFromCSV = async (file, onProgress) => {
  const rows = await parseCSVFile(file);
  const total = rows.length;
  const successes = [];
  const errors = [];
  const batchSize = 10;
  let processedCount = 0;
  const caches = {
    customerByEmail: new Map(),
    addressByKey: new Map(),
    productByReference: new Map(),
    optionValueByName: new Map(),
    combinationsByProductId: new Map(),
  };

  const handleRow = async (row) => {
    const email = row.email?.trim();

    try {
      if (!email) throw new Error("Email manquant");

      const achatItems = parseAchatColumn(row.achat);
      if (!achatItems.length)
        throw new Error("Colonne achat vide ou format invalide");

      const idOrderStateFinal = resolveOrderStateId(row.etat);
      const paymentInfo = getPaymentInfo(idOrderStateFinal);
      const dateAdd = parseDateTime(row.date);

      // 1. Résolution et Totaux
      const resolvedItems = await resolveAchatItems(achatItems, caches);
      const totals = computeOrderTotals(resolvedItems);

      // 2. Client & Adresse
      const customer = await ensureCustomer(row, caches);
      const address = await ensureAddress(customer.id, row, caches);

      // 3. Panier
      const cart = await createCart(
        customer.id,
        address.id,
        resolvedItems,
        dateAdd
      );

      const etatRaw = (row.etat || "").toLowerCase().trim();

      if (!etatRaw || etatRaw.includes("dans le panier")) {
        return {
          success: true,
          email,
          cartId: cart.id,
          status: "Panier créé (pas de commande)",
          totals,
        };
      }

      // 4. Commande
      const order = await createOrder({
        cartId: cart.id,
        customerId: customer.id,
        addressId: address.id,
        dateAdd,
        totals,
        resolvedItems,
        paymentInfo,
        idOrderState: idOrderStateFinal,
        secureKey: customer.secureKey,
      });

      const fullOrder = await getOrderById(order.id);
      // console.log(fullOrder);

      // 5. Paiement manuel DÉSACTIVÉ :
      // Le webservice génère tout seul le paiement lors du changement d'historique.
      // await createOrderPayment({ ... });
      if (idOrderStateFinal == 5 || idOrderStateFinal == 6) {
        try {
          await postOrderTransition({
            idOrder: fullOrder.id || order.id,
            idOrderState: idOrderStateFinal,
            idEmployee: 1,
            dateAdd,
          });
        } catch (movementErr) {
          console.warn(
            `Échec du postOrderTransition (statut livré):`,
            movementErr.message
          );
        }
      }

      return {
        success: true,
        email,
        orderId: order.id,
        orderReference: order.reference,
        idOrderState: idOrderStateFinal,
        totals,
      };
    } catch (error) {
      return {
        success: false,
        email,
        error: error.message,
      };
    }
  };

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchPromises = batch.map((row) =>
      handleRow(row).then((processResult) => {
        processResult.success
          ? successes.push(processResult)
          : errors.push(processResult);
        processedCount++;
        onProgress?.({ done: processedCount, total, result: processResult });
        return processResult;
      })
    );

    await Promise.all(batchPromises);
  }

  return { success: successes, errors };
};

export default importOrdersFromCSV;
