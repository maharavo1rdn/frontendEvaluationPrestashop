import parseCustomers, {
  parseCustomer,
} from "../XMLUtil/parser/Customer.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildCustomerXML } from "../XMLUtil/builder/Customer.builder";
import { getAll as getAllOrders } from "./order.service";
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
    console.error(err.message);

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

    if (!customers || customers.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < customers.length; i += chunkSize) {
      const chunk = customers.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((customer) => deleteCustomer(customer.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await fetch(
      `${API_URL()}/customers/${id}?output_format=XML`,
      { headers: authHeaders() }
    );
    const xmlText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} — ${xmlText}`);
    return parseCustomer(xmlText);
  } catch (error) {
    throw error;
  }
};
export const getTopCustomer = async (limit = null) => {
  const orders = await getAllOrders();
  const result = {};
  await Promise.all(
    orders.map(async (order) => {
      if (!result[order.idCustomer]) {
        const customer = await getCustomerById(order.idCustomer);
        result[order.idCustomer] = {
          totalOrder: 0,
          customer: `${customer.firstname} ${customer.lastname}`,
        };
      }
      result[order.idCustomer].totalOrder +=
        order.associations.orderRows.reduce(
          (sum, orderRow) =>
            sum +
            Number(orderRow.productQuantity) * Number(orderRow.productPrice),
          0
        );
    })
  );
  let topCustomers = Object.values(result).sort(
    (a, b) => b.totalOrder - a.totalOrder
  );
  if (limit) {
    const entries = Object.entries(topCustomers).slice(0, limit);
    topCustomers = Object.fromEntries(entries);
  }
  return topCustomers;
};
