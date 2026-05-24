import parseOrders, { parseOrder } from "../XMLUtil/parser/Order.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildOrderXML } from "../XMLUtil/builder/Order.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { findOrderStateByKeyValue } from "./orderState.service";
import { deleteCart, findCartByKeyValue, postCart } from "./cart.service";
import { findAddressByKeyValue } from "./address.service";
import { postOrderTransition } from "./stockTransition.service";
import { formatDate } from "../utils/utils";
import {
  computeTotals,
  resolveCartItems,
} from "./frontoffice/checkout.service";
import { findCustomerByKeyValue } from "./customer.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/orders?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)?.[0]?.message || "inconnue"
        }`
      );
    }
    const xmlText = await response.text();
    const orders = parseOrders(xmlText);

    const ordersWithStates = await Promise.all(
      orders.map(async (order) => {
        try {
          if (order.currentState) {
            const stateData = await findOrderStateByKeyValue(
              "id",
              order.currentState
            );
            order.current_state_label = stateData?.[0]?.name || "Inconnu";
          } else {
            order.current_state_label = "Inconnu";
          }
        } catch (e) {
          order.current_state_label = "Inconnu";
        }
        return order;
      })
    );

    return ordersWithStates;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/orders/${id}?output_format=XML`,
      { headers: authHeaders() }
    );
    const xmlText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${xmlText}`);
    return parseOrder(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findOrderByKeyValue = async (key, value) => {
  try {
    const params = new URLSearchParams({
      [`filter[${key}]`]: `[${value}]`,
      output_format: "XML",
      display: "full",
    });
    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");

    const response = await fetch(`${API_URL()}/orders?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    const xmlText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${xmlText}`);
    return parseOrders(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postOrder = async (order) => {
  const xml = buildOrderXML(order);
  try {
    const response = await fetch(`${API_URL()}/orders?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      console.error("XML erreur commande :", xmlText);
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseOrder(xmlText);
    const createdId = created?.id;

    if (order.dateAdd && createdId) {
      const fullOrder = await getOrderById(createdId);
      fullOrder.dateAdd = order.dateAdd;
      await putOrder(createdId, { ...fullOrder, id: createdId });
    }

    return {
      success: true,
      id: createdId,
      reference: created?.reference,
    };
  } catch (err) {
    console.error(err);

    return { success: false, id: order.id, error: err.message };
  }
};

export const putOrder = async (orderId, orderPayload) => {
  const xml = buildOrderXML({ ...orderPayload, id: orderId });
  try {
    const response = await fetch(
      `${API_URL()}/orders/${orderId}?output_format=XML`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: xml,
      }
    );
    const xmlText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${xmlText}`);

    const updated = parseOrder(xmlText);
    return {
      success: true,
      id: updated?.id,
      reference: updated?.reference,
    };
  } catch (err) {
    return { success: false, id: orderId, error: err.message };
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/orders/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetOrders = async () => {
  try {
    const orders = await getAll();
    if (!orders || orders.length === 0) return { success: true, deleted: 0 };

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((order) => deleteOrder(order.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};

export const duplicateCartFromOrder = async (orderId, quantity) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Commande introuvable");

  const carts = await findCartByKeyValue("id", order.idCart);
  if (!carts || carts.length == 0)
    throw new Error("Panier associée à la commande introuvable");

  const cart = carts[0];
  const rows = cart.associations.cartRows;
  const newCartsRows = rows.map((row) => ({
    ...row,
    quantity: Number(row.quantity) * Number(quantity),
  }));

  const customers = await findCustomerByKeyValue("id", order.idCustomer);
  if (!customers || customers.length == 0)
    throw new Error("Client associée au client introuvable");

  const customer = customers[0];
  const addresses = await findAddressByKeyValue(
    "id_customer",
    order.idCustomer
  );
  if (!addresses || addresses.length == 0)
    throw new Error("Addresse associée au client introuvable");

  const address = addresses[0];
  const newCart = {
    idCustomer: order.idCustomer,
    idAddressDelivery: address.id,
    secureKey: customer.secureKey,
    idAddressInvoice: address.id,
    idCurrency: 1,
    idCarrier: 2,
    idShop: 1,
    dateAdd: formatDate(new Date()),
    associations: { cartRows: newCartsRows },
  };
  return newCart;
};

export const createOrderFromCart = async (
  cartId,
  cart,
  payment = "Virement bancaire",
  module = "ps_checkpayment"
) => {
  const resolvedItems = await resolveCartItems(cart.associations.cartRows);
  const orderRows = resolvedItems.map((item) => ({
    productId: item.product.id,
    productAttributeId: item.combination?.id ?? 0,
    productQuantity: item.quantity,
    productName: item.product.name,
    productReference: item.product.reference,
    unitPriceTaxIncl: item.unitPriceTtc,
    unitPriceTaxExcl: item.unitPriceHt,
    totalPriceTaxIncl: item.unitPriceTtc * item.quantity,
    totalPriceTaxExcl: item.unitPriceHt * item.quantity,
    taxRate: item.taxRate,
  }));

  const { totals } = await computeTotals(resolvedItems);

  return {
    ...totals,
    idCart: cartId,
    idCustomer: cart.idCustomer,
    idAddressInvoice: cart.idAddressInvoice,
    idCurrency: 1,
    idLang: 1,
    idShop: 1,
    idCarrier: 1,
    currentState: 11,
    conversionRate: 1,
    secureKey: cart.secureKey,
    payment,
    module,
    dateAdd: formatDate(new Date()),
    valid: false,
    associations: { orderRows },
  };
};

export const duplicateOrder = async (idOrder, quantity, orderStateId = 11) => {
  try {
    const newCart = await duplicateCartFromOrder(idOrder, quantity);
    const createdCart = await postCart(newCart);
    if (!createdCart.success)
      throw new Error(
        `Impossible de créer le panier dupliqué: ${createdCart.error}`
      );

    if (createdCart && createdCart.id) {
      const newOrder = await createOrderFromCart(createdCart.id, newCart);

      const createdOrder = await postOrder(newOrder);
      if (!createdOrder.success || !createdOrder.id) {
        await deleteCart(createdCart.id);
        throw new Error(
          `Impossible de créer la commande dupliqué: ${createdOrder.error}`
        );
      }
      if (orderStateId == 5) {
        try {
          await postOrderTransition({
            idOrder: createdOrder.id,
            idOrderState: orderStateId,
            idEmployee: 1,
            dateAdd: formatDate(new Date()),
          });
        } catch (movementErr) {
          await deleteOrder(createdOrder.id);
          throw new Error(
            `Impossible de livrer la commande: #${createdOrder.id}`
          );
        }
      }
      return {
        success: true,
        orderId: createdOrder.id,
        reference: createdOrder.reference,
        cartId: createdCart.id,
      };
    }
  } catch (error) {
    throw new Error(`Erreur:${error.message}`);
  }
};
