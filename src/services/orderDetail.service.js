import parseOrderDetails, { parseOrderDetail } from "../XMLUtil/parser/OrderDetail.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildOrderDetailXML } from "../XMLUtil/builder/OrderDetail.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_details?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
      );
    const xmlText = await response.text();
    return parseOrderDetails(xmlText);
  } catch (error) {
    throw error;
  }
};

export const postOrderDetail = async (detail) => {
  const xml = buildOrderDetailXML(detail);
  try {
    const response = await fetch(
      `${API_URL()}/order_details?output_format=XML`,
      {
        method: "POST",
        headers: authHeaders(),
        body: xml,
      },
    );
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseOrderDetail(xmlText);
    return {
      success: true,
      id: created?.id,
    };
  } catch (err) {
    return { success: false, id: detail.id, error: err.message };
  }
};

export const deleteOrderDetail = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_details/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
				`Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetOrderDetails = async () => {
  try {
    const details = await getAll();
    for (const detail of details) {
      await deleteOrderDetail(detail.id);
    }
  } catch (error) {
    throw error;
  }
};
