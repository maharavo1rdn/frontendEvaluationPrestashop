import parseOrderCartRules from "../XMLUtil/parser/OrderCartRule.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/order_cart_rules?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    const xmlText = await response.text();
    return parseOrderCartRules(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteOrderCartRule = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/order_cart_rules/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
      },
    });
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetOrderCartRules = async () => {
  try {
    const rules = await getAll();
    rules.forEach((rule) => {
      deleteOrderCartRule(rule.id);
    });
  } catch (error) {
    throw error;
  }
};
