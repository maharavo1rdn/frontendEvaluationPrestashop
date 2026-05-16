import { buildCartXML } from "../XMLUtil/builder/Cart.builder";
import parseCarts, { parseCart } from "../XMLUtil/parser/Cart.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { findOrderByKeyValue } from "./order.service";
import { getAll as getAllOrders } from "./order.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/carts?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    const xmlText = await response.text();
    return parseCarts(xmlText);
  } catch (error) {
    throw error;
  }
};

export const getCartById = async (cartId) => {
  const response = await fetch(
    `${API_URL()}/carts/${cartId}?output_format=XML`,
    {
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur HTTP ${response.status} — ${errText}`);
  }
  const xmlText = await response.text();
  return parseCart(xmlText);
};

export const postCart = async (cart) => {
  const xml = buildCartXML(cart);
  try {
    const response = await fetch(`${API_URL()}/carts?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseCart(xmlText);
    const createdId = created?.id;

    if (cart.dateAdd && createdId) {
      await putCart(createdId, { ...cart, id: createdId });
    }

    return {
      success: true,
      id: createdId,
    };
  } catch (err) {
    return { success: false, id: cart.id, error: err.message };
  }
};

export const putCart = async (id, cart) => {
  const xml = buildCartXML({ id, ...cart });

  try {
    const response = await fetch(`${API_URL()}/carts/${id}?output_format=XML`, {
      method: "PUT",
      headers: authHeaders(),
      body: xml,
    });

    const xmlText = await response.text();

    if (!response.ok) {
      let errorMessage = xmlText;
      try {
        const errors = parseErrors(xmlText);
        if (errors && errors.length > 0) errorMessage = errors[0].message;
      } catch (e) {}
      throw new Error(`HTTP ${response.status} — ${errorMessage}`);
    }

    const updated = parseCart(xmlText);
    return {
      success: true,
      id: updated?.id || id,
    };
  } catch (err) {
    return {
      success: false,
      id: id,
      error: err.message,
    };
  }
};

export const deleteCart = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/carts/${id}`, {
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

export const resetCarts = async () => {
  try {
    const carts = await getAll();

    if (!carts || carts.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < carts.length; i += chunkSize) {
      const chunk = carts.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((cart) => deleteCart(cart.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};

export const findCartByKeyValue = async (key, value) => {
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

    const response = await fetch(`${API_URL()}/carts?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    const xmlText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${xmlText}`);
    return parseCarts(xmlText);
  } catch (error) {
    throw error;
  }
};

export const getUnorderedCartsByCustomer = async (customerId) => {
  try {
    const userOrders = await findOrderByKeyValue("id_customer", customerId);
    const orderedCartIds = new Set(
      userOrders.map((order) => String(order.idCart))
    );

    const userCarts = await findCartByKeyValue("id_customer", customerId);

    const unorderedCarts = userCarts
      .filter((cart) => {
        const isUserCart = String(cart.idCustomer) === String(customerId);
        const isNotOrdered = !orderedCartIds.has(String(cart.id));
        return isUserCart && isNotOrdered;
      })
      .sort((a, b) => new Date(b.dateAdd) - Date(a.dateAdd));

    return unorderedCarts;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des paniers non commandés:",
      error
    );
    throw error;
  }
};

export const getUnorderedCarts = async () => {
  try {
    const orders = await getAllOrders();
    const orderedCartIds = new Set(orders.map((order) => String(order.idCart)));

    const carts = await getAll();

    const unorderedCarts = carts
      .filter((cart) => !orderedCartIds.has(String(cart.id)))
      .sort((a, b) => new Date(b.dateAdd) - new Date(a.dateAdd));

    return unorderedCarts;
  } catch (error) {
    console.error("Erreur lors de la récupération des paniers non commandés:", error);
    throw error;
  }
};