import parseCustomers, { parseCustomer } from "../XMLUtil/parser/Customer.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildCustomerXML } from "../XMLUtil/builder/Customer.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/customers?output_format=XML&display=${display}`,
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
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    }
    const xmlText = await response.text();
    return parseCustomers(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findCustomerByKeyValue = async (key, value) => {
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
    const response = await fetch(`${API_URL()}/customers?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseCustomers(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const postCustomer = async (customer) => {
  const xml = buildCustomerXML(customer);
  try {
    const response = await fetch(`${API_URL()}/customers?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseCustomer(xmlText);
    return {
      success: true,
      id: created?.id,
      secureKey: created?.secureKey,
    };
  } catch (err) {
    return { success: false, id: customer.id, error: err.message };
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/customers/${id}`, {
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

export const resetCustomers = async () => {
  try {
    const customers = await getAll();
    for (const customer of customers) {
      await deleteCustomer(customer.id);
    }
  } catch (error) {
    throw error;
  }
};
