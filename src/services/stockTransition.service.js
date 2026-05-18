import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, authHeaders } from "../config/config.service";

const buildOrderTransitionXML = ({
  idOrder,
  idOrderState,
  idEmployee,
  dateAdd,
}) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_transition>
    <id_order><![CDATA[${Number(idOrder)}]]></id_order>
    <id_order_state><![CDATA[${Number(idOrderState)}]]></id_order_state>
    ${
      idEmployee
        ? `<id_employee><![CDATA[${Number(idEmployee)}]]></id_employee>`
        : ""
    }
    ${dateAdd ? `<date_add><![CDATA[${dateAdd}]]></date_add>` : ""}
  </order_transition>
</prestashop>`;

const parseResponseOrThrow = async (response) => {
  const text = await response.text();
  if (!response.ok) {
    const errors = parseErrors(text);
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }
    throw new Error(text || `HTTP ${response.status}`);
  }
  return { success: true, xml: text };
};

export const postOrderTransition = async ({
  idOrder,
  idOrderState,
  idEmployee,
  dateAdd,
}) => {
  const response = await fetch(
    `${API_URL()}/order_transitions?output_format=XML`,
    {
      method: "POST",
      headers: authHeaders(),
      body: buildOrderTransitionXML({
        idOrder,
        idOrderState,
        idEmployee,
        dateAdd,
      }),
    }
  );

  return parseResponseOrThrow(response);
};
