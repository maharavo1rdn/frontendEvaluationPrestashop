import parseProductOptionValues, {
  parseProductOptionValue,
} from "../XMLUtil/parser/ProductOptionValue.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";
import { buildProductOptionValueXML } from "../XMLUtil/builder/ProductOptionValue.builder";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/product_option_values?output_format=XML&display=${display}`,
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
          parseErrors(errText)[0]?.message || "inconnue"
        }`
      );
    }
    const xmlText = await response.text();
    return parseProductOptionValues(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findProductOptionValueByKeyValue = async (key, value) => {
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
    const response = await fetch(
      `${API_URL()}/product_option_values?${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseProductOptionValues(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const postProductOptionValue = async (productOptionValue) => {
  const xml = buildProductOptionValueXML(productOptionValue);
  try {
    const response = await fetch(
      `${API_URL()}/product_option_values?output_format=XML`,
      {
        method: "POST",
        headers: authHeaders(),
        body: xml,
      }
    );
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseProductOptionValue(xmlText);
    return {
      success: true,
      name: productOptionValue.name,
      id: created?.id,
    };
  } catch (err) {
    return {
      success: false,
      name: productOptionValue.name,
      error: err.message,
    };
  }
};

export const deleteProductOptionValue = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/product_option_values/${id}`, {
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
          parseErrors(errText)[0]?.message || "inconnue"
        }`
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetProductOptionValues = async () => {
  try {
    const values = await getAll();
    for (const value of values) {
      await deleteProductOptionValue(value.id);
    }
  } catch (error) {
    throw error;
  }
};
