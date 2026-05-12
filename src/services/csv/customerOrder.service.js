import { parseCSVFile } from "./csv.service";
import { findCustomerByKeyValue, postCustomer } from "../customer.service";
import { findAddressByKeyValue, postAddress } from "../address.service";
import { postCart } from "../cart.service";
import { postOrder } from "../order.service";
import { postOrderDetail } from "../orderDetail.service";
import { postOrderHistory } from "../orderHistory.service";
import { postOrderPayment } from "../orderPayment.service";
import { findProductByKeyValue } from "../product.service";
import { findCombinationsByProductId } from "../combination.service";
import { findProductOptionValueByKeyValue } from "../productOptionValue.service";
import { findTaxRulesByGroupId } from "../taxRule.service";
import { findTaxByKeyValue } from "../tax.service";

const ORDER_STATE_MAP = {
  "paiement accepté": 2,
  "en attente paiement à la livraison": 8,
  "erreur de paiement": 6,
  annulé: 6,
  livré: 5,
  expédié: 4,
  "en cours de préparation": 3,
  "en attente de virement": 10,
};

const PAYMENT_INFO_MAP = {
  2: { payment: "Bank wire", module: "ps_wirepayment" },
};

const CSV_DEFAULTS = {
  idCarrier: 2,
  payment: "Bank wire",
  module: "ps_wirepayment",
};

const parseDate = (value) => {
  if (!value?.trim()) return undefined;
  const [day, month, year] = value.trim().split("/");
  if (!day || !month || !year) return undefined;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} 00:00:00`;
};

/**
 * Sépare un nom complet en firstname / lastname.
 * Si un seul mot, lastname = "-" (PS oblige les deux champs).
 */
const parseName = (nom) => {
  if (!nom?.trim()) return { firstname: "Inconnu", lastname: "-" };
  const parts = nom.trim().split(/\s+/);
  return {
    firstname: parts[0],
    lastname: parts.length > 1 ? parts.slice(1).join(" ") : "-",
  };
};

/**
 * Parse la colonne achat au format [(""T_01"";3;""ngoza"")]
 * Après parsing CSV papaparse → [("T_01";3;"ngoza")]
 * Retourne un tableau de { reference, quantity, karazany }.
 */
const parseAchatColumn = (raw) => {
  if (!raw?.trim()) return [];
  const cleaned = raw.trim().slice(1, -1); // retire [ et ]
  const items = [];
  const tupleRegex = /\("([^"]*)";(\d+);"([^"]*)"\)/g;
  let match;
  while ((match = tupleRegex.exec(cleaned)) !== null) {
    items.push({
      reference: match[1],
      quantity: parseInt(match[2], 10),
      karazany: match[3] || null,
    });
  }
  return items;
};

const resolveOrderStateId = (etat) => {
  if (!etat) return 1;
  const key = etat.trim().toLowerCase();
  for (const [label, id] of Object.entries(ORDER_STATE_MAP)) {
    console.log(key+"ici");
    
    if (label.toLowerCase() === key){
      console.log(id);
      
      return id;
    } 
      
  }

  return 1;
};

const getPaymentInfo = (idOrderState) => PAYMENT_INFO_MAP[idOrderState] ?? null;

const generateSecureKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const formatDecimal = (value, decimals = 6) => {
  if (value === undefined || value === null || !Number.isFinite(value))
    return "0.000000";
  return value.toFixed(decimals);
};


const taxRateCache = new Map();

const getTaxRateByGroupId = async (groupId) => {
  if (!groupId) return 0;
  const cacheKey = String(groupId);
  if (taxRateCache.has(cacheKey)) return taxRateCache.get(cacheKey);

  const rules = await findTaxRulesByGroupId(groupId);
  const taxId = rules[0]?.taxId;
  if (!taxId) {
    taxRateCache.set(cacheKey, 0);
    return 0;
  }

  const taxes = await findTaxByKeyValue("id", taxId);
  const rate = Number(taxes[0]?.rate) || 0;
  taxRateCache.set(cacheKey, rate);
  return rate;
};

const normalizeIds = (ids) => ids.map((id) => String(id)).sort();

/**
 * Trouve la combinaison d'un produit qui contient une valeur d'attribut donnée.
 * Utilise le même mécanisme que findMatchingCombination dans productOption.csv.service.
 */
const findCombinationByValueName = async (productId, valueName) => {
  const optionValues = await findProductOptionValueByKeyValue(
    "name",
    valueName
  );
  if (!optionValues.length) {
    throw new Error(`Valeur d'attribut "${valueName}" introuvable`);
  }
  const targetId = String(optionValues[0].id);

  const combinations = await findCombinationsByProductId(productId);
  const combination = combinations.find((c) => {
    const attrIds = normalizeIds(c?.associations?.productOptionValues ?? []);
    return attrIds.includes(targetId);
  });

  if (!combination) {
    throw new Error(
      `Aucune combinaison avec l'attribut "${valueName}" pour le produit id=${productId}`
    );
  }

  return combination;
};

/**
 * Résout chaque tuple achat en objet enrichi avec le produit,
 * la combinaison éventuelle, et les prix calculés.
 *
 * @param {Array<{reference, quantity, karazany}>} items
 * @returns {Promise<Array>}
 */
const resolveAchatItems = async (items) => {
  const resolved = [];

  for (const item of items) {
    const products = await findProductByKeyValue("reference", item.reference);
    if (!products.length) {
      throw new Error(`Produit "${item.reference}" introuvable`);
    }
    const product = products[0];
    const taxRate = await getTaxRateByGroupId(product.idTaxRulesGroup);

    let combination = null;
    let unitPriceHt = Number(product.price) || 0;

    if (item.karazany) {
      combination = await findCombinationByValueName(product.id, item.karazany);
      unitPriceHt = unitPriceHt + (Number(combination.price) || 0);
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

/**
 * Calcule les totaux de la commande depuis les lignes résolues.
 */
const computeOrderTotals = (resolvedItems) => {
  const totalProductsHt = resolvedItems.reduce(
    (acc, item) => acc + item.unitPriceHt * item.quantity,
    0
  );
  const totalProductsTtc = resolvedItems.reduce(
    (acc, item) => acc + item.unitPriceTtc * item.quantity,
    0
  );

  return {
    totalProducts: formatDecimal(totalProductsHt),
    totalProductsWt: formatDecimal(totalProductsTtc),
    totalPaid: formatDecimal(totalProductsTtc),
    totalPaidTaxIncl: formatDecimal(totalProductsTtc),
    totalPaidTaxExcl: formatDecimal(totalProductsHt),
    totalPaidReal: "0.000000",
    totalShipping: "0.000000",
    totalShippingTaxIncl: "0.000000",
    totalShippingTaxExcl: "0.000000",
    totalDiscounts: "0.000000",
    totalDiscountsTaxIncl: "0.000000",
    totalDiscountsTaxExcl: "0.000000",
  };
};

// ─── Find or create ───────────────────────────────────────────────────────────

/**
 * Trouve ou crée un client par email.
 */
const ensureCustomer = async (row) => {
  const existing = await findCustomerByKeyValue("email", row.email);
  if (existing.length > 0) return existing[0];

  const { firstname, lastname } = parseName(row.nom);

  const created = await postCustomer({
    firstname,
    lastname,
    email: row.email,
    passwd: row.pwd,
    active: true,
  });

  if (!created.success) {
    throw new Error(
      `Impossible de créer le client "${row.email}": ${created.error}`
    );
  }

  let secureKey = created.secureKey;
  if (!secureKey && created.id) {
    const retry = await findCustomerByKeyValue("id", created.id);
    secureKey = retry[0]?.secureKey;
  }

  return {
    id: created.id,
    firstname,
    lastname,
    email: row.email,
    secureKey,
  };
};

/**
 * Trouve ou crée une adresse pour un client.
 * Déduplication sur id_customer + address1.
 */
const ensureAddress = async (customerId, row) => {
  const allAddresses = await findAddressByKeyValue("id_customer", customerId);
  const existing = allAddresses.find(
    (a) =>
      a.address1?.trim().toLowerCase() === row.adresse?.trim().toLowerCase()
  );
  if (existing) return existing;

  const { firstname, lastname } = parseName(row.nom);

  const created = await postAddress({
    idCustomer: customerId,
    idCountry: 8,
    alias: "import",
    firstname,
    lastname,
    address1: row.adresse,
    city: row.adresse, // pas de champ ville distinct dans le CSV
  });

  if (!created.success) {
    throw new Error(
      `Impossible de créer l'adresse "${row.adresse}": ${created.error}`
    );
  }

  return { id: created.id };
};

/**
 * Crée le panier avec toutes ses lignes produits.
 */
const createCart = async (customerId, addressId, resolvedItems) => {
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
    idCurrency: 1,
    idCarrier: CSV_DEFAULTS.idCarrier,
    associations: { cartRows },
  });

  if (!created.success) {
    throw new Error(`Impossible de créer le panier: ${created.error}`);
  }

  return { id: created.id };
};

/**
 * Crée la commande depuis le panier avec tous les order_rows.
 */
const createOrder = async ({
  cartId,
  customerId,
  addressId,
  idOrderState,
  conversionRate,
  dateAdd,
  totals,
  resolvedItems,
  paymentInfo,
  secureKey,
}) => {
  const orderRows = resolvedItems.map((item) => ({
    productId: item.product.id,
    productAttributeId: item.combination?.id ?? 0,
    productQuantity: item.quantity,
    productName: item.product.name ?? item.reference,
    productReference: item.reference,
    unitPriceTaxIncl: formatDecimal(item.unitPriceTtc),
    unitPriceTaxExcl: formatDecimal(item.unitPriceHt),
    totalPriceTaxIncl: formatDecimal(item.unitPriceTtc * item.quantity),
    totalPriceTaxExcl: formatDecimal(item.unitPriceHt * item.quantity),
    taxRate: formatDecimal(item.taxRate, 3),
  }));
  const orderPayload = {
    idCart: cartId,
    idCustomer: customerId,
    idAddressDelivery: addressId,
    idAddressInvoice: addressId,
    idCurrency: 1,
    idCarrier: CSV_DEFAULTS.idCarrier,
    currentState: idOrderState,
    conversionRate: conversionRate,
    secureKey: secureKey || generateSecureKey(),
    dateAdd,
    valid: idOrderState === 2,
    ...totals,
    associations: { orderRows },
  };

  if (paymentInfo) {
    orderPayload.payment = paymentInfo.payment;
    orderPayload.module = paymentInfo.module;
  }

  const created = await postOrder(orderPayload);

  if (!created.success) {
    throw new Error(`Impossible de créer la commande: ${created.error}`);
  }

  return { id: created.id, reference: created.reference };
};

/**
 * Crée le payment PS quand l'etat est "paiement accepte".
 */
const createOrderPayment = async ({ order, totals, paymentInfo }) => {
  if (!paymentInfo) return null;
  const created = await postOrderPayment({
    orderReference: order.reference,
    idCurrency: 1,
    amount: totals.totalPaidTaxIncl,
    paymentMethod: paymentInfo.payment,
    conversionRate: 1,
  });

  if (!created.success) {
    throw new Error(`Impossible de creer le paiement: ${created.error}`);
  }

  return { id: created.id };
};

/**
 * Crée les order_details — une ligne par produit de la commande.
 * Note : PS peut les auto-créer depuis les order_rows, auquel cas
 * ces appels retourneront une erreur ignorable.
 */
const createOrderDetails = async (orderId, resolvedItems) => {
  const details = [];

  for (const item of resolvedItems) {
    const unitPriceTtc = formatDecimal(item.unitPriceTtc);
    const unitPriceHt = formatDecimal(item.unitPriceHt);
    const totalTtc = formatDecimal(item.unitPriceTtc * item.quantity);
    const totalHt = formatDecimal(item.unitPriceHt * item.quantity);

    const created = await postOrderDetail({
      idOrder: orderId,
      productId: item.product.id,
      idWarehouse: 0,
      idShop: 1,
      productAttributeId: item.combination?.id ?? 0,
      productName: item.product.name ?? item.reference,
      productQuantity: item.quantity,
      productReference: item.reference,
      productPrice: unitPriceHt,
      unitPriceTaxIncl: unitPriceTtc,
      unitPriceTaxExcl: unitPriceHt,
      totalPriceTaxIncl: totalTtc,
      totalPriceTaxExcl: totalHt,
      taxRate: formatDecimal(item.taxRate, 3),
      taxName: `TVA ${item.taxRate}%`,
    });

    if (!created.success) {
      throw new Error(
        `Impossible de créer le détail pour "${item.reference}": ${created.error}`
      );
    }

    details.push({ id: created.id, reference: item.reference });
  }

  return details;
};

/**
 * Crée l'entrée d'historique qui fixe l'état initial de la commande.
 */
const createOrderHistory = async (orderId, idOrderState, dateAdd) => {
  const created = await postOrderHistory({
    idOrder: orderId,
    idOrderState,
    idEmployee: 0,
    dateAdd,
  });

  if (!created.success) {
    throw new Error(
      `Impossible de créer l'historique de commande: ${created.error}`
    );
  }

  return { id: created.id };
};

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Importe les commandes depuis un fichier CSV.
 * Traite chaque ligne séquentiellement pour respecter les dépendances FK.
 *
 * Colonnes attendues :
 *   date, nom, email, pwd, adresse, achat, etat
 *
 * Format de la colonne achat :
 *   [(""reference"";qty;""karazany""), ...]
 *
 * @param {File}     file        - Fichier CSV sélectionné
 * @param {Function} onProgress  - Callback après chaque ligne
 *   → onProgress({ done: number, total: number, result: Object })
 *
 * @returns {Promise<{ success: Object[], errors: Object[] }>}
 */
export const importOrdersFromCSV = async (file, onProgress) => {
  const rows = await parseCSVFile(file);
  const total = rows.length;
  const successes = [];
  const errors = [];
  let processedCount = 0;

  for (const row of rows) {
    const email = row.email?.trim();
    let processResult = null;

    try {
      if (!email) throw new Error("Email manquant");

      const achatItems = parseAchatColumn(row.achat);
      if (!achatItems.length)
        throw new Error("Colonne achat vide ou format invalide");

      const idOrderState = resolveOrderStateId(row.etat);
      const paymentInfo = getPaymentInfo(idOrderState);
      const orderPaymentInfo =
        paymentInfo ??
        { payment: CSV_DEFAULTS.payment, module: CSV_DEFAULTS.module };
      const dateAdd = parseDate(row.date);

      // 1. Résolution produits + prix
      const resolvedItems = await resolveAchatItems(achatItems);
      const totals = computeOrderTotals(resolvedItems);

      // 2. Client
      const customer = await ensureCustomer(row);

      // 3. Adresse
      const address = await ensureAddress(customer.id, row);

      // 4. Panier
      const cart = await createCart(customer.id, address.id, resolvedItems);

      // 5. Commande
      const order = await createOrder({
        cartId: cart.id,
        customerId: customer.id,
        addressId: address.id,
        idOrderState,
        conversionRate: 1,
        dateAdd,
        totals,
        resolvedItems,
        paymentInfo: orderPaymentInfo,
        secureKey: customer.secureKey,
      });

      // // 6. Détails commande
      // const orderDetails = await createOrderDetails(order.id, resolvedItems);

      // 6. Paiement si accepte
      const orderPayment = await createOrderPayment({
        order,
        totals,
        paymentInfo,
      });

      // 7. Historique (etat initial)
      const orderHistory = await createOrderHistory(
        order.id,
        idOrderState,
        dateAdd
      );

      processResult = {
        success: true,
        email,
        customerId: customer.id,
        addressId: address.id,
        cartId: cart.id,
        orderId: order.id,
        orderReference: order.reference,
        idOrderState,
        orderPaymentId: orderPayment?.id ?? null,
        items: resolvedItems.map((i) => ({
          reference: i.reference,
          karazany: i.karazany,
          quantity: i.quantity,
          unitPriceTtc: i.unitPriceTtc,
        })),
        totals
      };

      successes.push(processResult);
    } catch (error) {
      processResult = {
        success: false,
        email,
        date: row.date?.trim(),
        achat: row.achat?.trim(),
        error: error.message,
      };
      errors.push(processResult);
    }

    processedCount++;
    onProgress?.({ done: processedCount, total, result: processResult });
  }

  return { success: successes, errors };
};

export default importOrdersFromCSV;
