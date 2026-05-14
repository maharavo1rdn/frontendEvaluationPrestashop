import bcrypt from "bcryptjs";
import parseErrors from "../../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY, authHeaders } from "../../config/config.service";
import parseEmployees from "../../XMLUtil/parser/Employee.parser";
const DEFAULT_DISPLAY = "full";

export const findEmployeeByKeyValue = async (key, value) => {
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
    const response = await fetch(`${API_URL()}/employees?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseEmployees(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const LoginBackOffice = async (email, passwd) => {
  const employees = await findEmployeeByKeyValue("email", email);

  if (!employees || employees.length === 0) {
    throw new Error("Employé introuvable");
  }

  const employee = employees[0];
  const hash = employee.passwd;

  const isMatch = bcrypt.compareSync(passwd, hash);
  if (!isMatch) {
    throw new Error("Mot de passe incorrect");
  }

  const { passwd: _, ...employeeData } = employee;
  return employeeData;
};
