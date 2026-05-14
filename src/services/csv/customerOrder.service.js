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

// ─── Constantes ───────────────────────────────────────────────────────────────

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
  2:  { payment: "Virement bancaire",       module: "ps_checkpayment"   },
  8:  { payment: "Paiement à la livraison", module: "ps_cashondelivery" },
  6:  { payment: "Virement bancaire",       module: "ps_checkpayment"   },
  5:  { payment: "Virement bancaire",       module: "ps_checkpayment"   },
  4:  { payment: "Virement bancaire",       module: "ps_checkpayment"   },
  3:  { payment: "Virement bancaire",       module: "ps_checkpayment"   },
  10: { payment: "Virement bancaire",       module: "ps_checkpayment"   },
};

const DEFAULTS = {
  idCarrier:      2,
  idCurrency:     1,
  idLang:         1,
  idCountry:      8,
  idEmployee:     0,
  conversionRate: 1,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDate = (value) => {
  if (!value?.trim()) return undefined;
  const [day, month, year] = value.trim().split("/");
  if (!day || !month || !year) return undefined;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} 00:00:00`;
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
  const cleaned = raw.trim().slice(1, -1);
  const items = [];
  const tupleRegex = /\("([^"]*)";(\d+);"([^"]*)"\)/g;
  let match;
  while ((match = tupleRegex.exec(cleaned)) !== null) {
    items.push({
      reference: match[1],
      quantity:  parseInt(match[2], 10),
      karazany:  match[3] || null,
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
  PAYMENT_INFO_MAP[idOrderState] ??
  { payment: "Virement bancaire", module: "ps_wirepayment" };

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
  if (!taxId) { taxRateCache.set(key, 0); return 0; }

  const taxes = await findTaxByKeyValue("id", taxId);
  const rate = Number(taxes[0]?.rate) || 0;
  taxRateCache.set(key, rate);
  return rate;
};

// ─── Résolution produits ──────────────────────────────────────────────────────

const normalizeIds = (ids) => ids.map((id) => String(id)).sort();

const findCombinationByValueName = async (productId, valueName) => {
  const optionValues = await findProductOptionValueByKeyValue("name", valueName);
  if (!optionValues.length)
    throw new Error(`Valeur d'attribut "${valueName}" introuvable`);

  const targetId     = String(optionValues[0].id);
  const combinations = await findCombinationsByProductId(productId);
  const combination  = combinations.find((c) =>
    normalizeIds(c?.associations?.productOptionValues ?? []).includes(targetId)
  );

  if (!combination)
    throw new Error(
      `Aucune combinaison avec l'attribut "${valueName}" pour produit id=${productId}`
    );

  return combination;
};

const resolveAchatItems = async (items) => {
  const resolved = [];

  for (const item of items) {
    const products = await findProductByKeyValue("reference", item.reference);
    if (!products.length)
      throw new Error(`Produit "${item.reference}" introuvable`);

    const product     = products[0];
    const taxRate     = await getTaxRateByGroupId(product.idTaxRulesGroup);
    let   combination = null;
    let   unitPriceHt = Number(product.price) || 0;

    if (item.karazany) {
      combination = await findCombinationByValueName(product.id, item.karazany);
      unitPriceHt += Number(combination.price) || 0;
    }

    const unitPriceTtc = unitPriceHt * (1 + taxRate / 100);

    resolved.push({
      product, combination,
      quantity: item.quantity,
      unitPriceHt, unitPriceTtc, taxRate,
      reference: item.reference,
      karazany: item.karazany,
    });
  }

  return resolved;
};

const computeOrderTotals = (resolvedItems) => {
  const totalHt  = resolvedItems.reduce((s, i) => s + i.unitPriceHt  * i.quantity, 0);
  const totalTtc = resolvedItems.reduce((s, i) => s + i.unitPriceTtc * i.quantity, 0);

  return {
    totalProducts:         roundMoney(totalHt),
    totalProductsWt:       roundMoney(totalTtc),
    totalPaid:             roundMoney(totalTtc),
    totalPaidTaxIncl:      roundMoney(totalTtc),
    totalPaidTaxExcl:      roundMoney(totalHt),
    totalPaidReal:         "0.000000", // Forcé à 0 pour la création
    totalShipping:         "0.000000",
    totalShippingTaxIncl:  "0.000000",
    totalShippingTaxExcl:  "0.000000",
    totalDiscounts:        "0.000000",
    totalDiscountsTaxIncl: "0.000000",
    totalDiscountsTaxExcl: "0.000000",
  };
};

// ─── Find or create ───────────────────────────────────────────────────────────

const ensureCustomer = async (row) => {
  const existing = await findCustomerByKeyValue("email", row.email);
  if (existing.length > 0) return existing[0];

  const { firstname, lastname } = parseName(row.nom);
  const created = await postCustomer({
    firstname, lastname,
    email:  row.email,
    passwd: row.pwd,
    active: true,
  });
  if (!created.success)
    throw new Error(`Impossible de créer le client "${row.email}": ${created.error}`);

  let secureKey = created.secureKey;
  if (!secureKey && created.id) {
    const retry = await findCustomerByKeyValue("id", created.id);
    secureKey = retry[0]?.secureKey;
  }
  return { id: created.id, firstname, lastname, email: row.email, secureKey };
};

const ensureAddress = async (customerId, row) => {
  const all      = await findAddressByKeyValue("id_customer", customerId);
  const existing = all.find(
    (a) => a.address1?.trim().toLowerCase() === row.adresse?.trim().toLowerCase()
  );
  if (existing) return existing;

  const { firstname, lastname } = parseName(row.nom);
  const created = await postAddress({
    idCustomer: customerId,
    idCountry:  DEFAULTS.idCountry,
    idState:    1,
    alias:      "import",
    firstname,  lastname,
    address1:   row.adresse,
    city:       row.adresse,
  });
  if (!created.success)
    throw new Error(`Impossible de créer l'adresse "${row.adresse}": ${created.error}`);
  return { id: created.id };
};

const createCart = async (customerId, addressId, resolvedItems) => {
  const cartRows = resolvedItems.map((item) => ({
    idProduct:          item.product.id,
    idProductAttribute: item.combination?.id ?? 0,
    idAddressDelivery:  addressId,
    quantity:           item.quantity,
  }));
  const created = await postCart({
    idCustomer:        customerId,
    idAddressDelivery: addressId,
    idAddressInvoice:  addressId,
    idCurrency:        DEFAULTS.idCurrency,
    idCarrier:         DEFAULTS.idCarrier,
    associations:      { cartRows },
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
    productId:          item.product.id,
    productAttributeId: item.combination?.id ?? 0,
    productQuantity:    item.quantity,
    productName:        item.product.name ?? item.reference,
    productReference:   item.reference,
    unitPriceTaxIncl:   roundMoney(item.unitPriceTtc),
    unitPriceTaxExcl:   roundMoney(item.unitPriceHt),
    totalPriceTaxIncl:  roundMoney(item.unitPriceTtc * item.quantity),
    totalPriceTaxExcl:  roundMoney(item.unitPriceHt  * item.quantity),
    taxRate:            item.taxRate.toFixed(3),
  }));

  const orderPayload = {
    ...totals,
    idCart:            cartId,
    idCustomer:        customerId,
    idAddressDelivery: addressId,
    idAddressInvoice:  addressId,
    idCurrency:        DEFAULTS.idCurrency,
    idCarrier:         DEFAULTS.idCarrier,
    conversionRate:    DEFAULTS.conversionRate,
    secureKey:         secureKey || generateSecureKey(),
    payment:      paymentInfo.payment,
    module:       paymentInfo.module,        // ← plus de hardcode
    dateAdd,
    // PS auto-crée order_payment au POST — ne pas appeler postOrderPayment manuellement
    // État final directement → pas de createOrderHistory → pas de hooks → pas de doublon
    currentState: idOrderState,              // ← plus de hardcode à 10
    valid:        idOrderState === 2,        // ← valid=1 seulement pour paiement accepté
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

const createOrderPayment = async ({ orderReference, amount, paymentMethod, dateAdd }) => {
  if (!orderReference) throw new Error("Référence de commande manquante pour le paiement");

  const created = await postOrderPayment({
    orderReference,
    idCurrency:     DEFAULTS.idCurrency,
    amount:         amount,
    paymentMethod:  paymentMethod,
    conversionRate: DEFAULTS.conversionRate,
    dateAdd,
  });
  if (!created.success)
    throw new Error(`Impossible de créer le paiement: ${created.error}`);
  return { id: created.id };
};

const createOrderHistory = async (orderId, idOrderState, dateAdd) => {
  const created = await postOrderHistory({
    idOrder:      orderId,
    idOrderState,
    idEmployee:   DEFAULTS.idEmployee,
    dateAdd,
  });
  if (!created.success)
    throw new Error(`Impossible de créer l'historique: ${created.error}`);
  return { id: created.id };
};

// ─── Export principal ─────────────────────────────────────────────────────────

export const importOrdersFromCSV = async (file, onProgress) => {
  const rows          = await parseCSVFile(file);
  const total         = rows.length;
  const successes     = [];
  const errors        = [];
  let   processedCount = 0;

  for (const row of rows) {
    const email = row.email?.trim();
    let processResult = null;

    try {
      if (!email) throw new Error("Email manquant");

      const achatItems = parseAchatColumn(row.achat);
      if (!achatItems.length)
        throw new Error("Colonne achat vide ou format invalide");

      const idOrderStateFinal = resolveOrderStateId(row.etat);
      const paymentInfo       = getPaymentInfo(idOrderStateFinal);
      const dateAdd           = parseDate(row.date);

      // 1. Résolution et Totaux
      const resolvedItems = await resolveAchatItems(achatItems);
      const totals        = computeOrderTotals(resolvedItems);

      // 2. Client & Adresse
      const customer = await ensureCustomer(row);
      const address  = await ensureAddress(customer.id, row);

      // 3. Panier
      const cart = await createCart(customer.id, address.id, resolvedItems);
      
      const etatRaw = (row.etat || "").toLowerCase().trim();
      console.log(cart);
      
      if (!etatRaw || etatRaw === "dans le panier panier") {
        processResult = {
          success: true,
          email,
          cartId: cart.id,
          status: "Panier créé (pas de commande)",
          totals,
        };
        successes.push(processResult);
        
        // TRÈS IMPORTANT : On s'arrête ici pour cette ligne
        onProgress?.({ done: processedCount + 1, total, result: processResult });
        continue;
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
      await createOrderHistory(order.id, idOrderStateFinal, dateAdd)

      processResult = {
        success:        true,
        email,
        orderId:        order.id,
        orderReference: order.reference,
        idOrderState:   idOrderStateFinal,
        totals,
      };

      successes.push(processResult);
    } catch (error) {
      processResult = {
        success: false,
        email,
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