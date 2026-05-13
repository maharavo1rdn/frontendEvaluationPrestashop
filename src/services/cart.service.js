import { buildCartXML } from "../XMLUtil/builder/Cart.builder";
import parseCarts, { parseCart } from "../XMLUtil/parser/Cart.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

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
    return {
      success: true,
      id: created?.id,
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
  const results = { deleted: [], failed: [] };
  const carts = await getAll();
  try {
    for (const cart of carts) {
      await deleteCart(cart.id);
    }
  } catch (error) {
    results.failed.push({ id: cart.id, reason: error.message });
  }
  return results;
};
