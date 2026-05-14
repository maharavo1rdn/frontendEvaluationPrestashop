import bcrypt from "bcryptjs";
import parseErrors from "../../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../../config/config.service";
import parseCustomers from "../../XMLUtil/parser/Customer.parser";
const DEFAULT_DISPLAY = "full";

export const findCustomerByKeyValue = async (key, value) => {
  try {
    const params = new URLSearchParams({
      [`filter[${key}]`]: `[${value}]`,
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

export const LoginFrontOffice = async (email, passwd) => {
  const customers = await findCustomerByKeyValue("email", email);
  if (
    customers == null ||
    customers == undefined ||
    (await customers).length == 0
  ) {
    throw new Error("Client introuvable");
  }
  const customer = customers[0];
  const hash = customer.passwd;

  const isMatch = bcrypt.compareSync(passwd, hash);
  if (!isMatch) {
    throw new Error("Mot de passe incorrect");
  }
  const { passwd: _, ...customerData } = customer;

  return {
    customer: {
      id: customer.id,
      email: customer.email,
      firstname: customer.firstname,
      lastname: customer.lastname,
      idLang: customer.idLang,
      secureKey: customer.secureKey,
    },
    customerData,
  };
};
