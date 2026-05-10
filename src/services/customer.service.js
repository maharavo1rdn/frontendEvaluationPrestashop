import parseCustomers from "../XMLUtil/parser/Customer.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY } from "../config/config.service";

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
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
      );
    const xmlText = await response.text();
    return parseCustomers(xmlText);
  } catch (error) {
    throw error;
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
				`Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
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
