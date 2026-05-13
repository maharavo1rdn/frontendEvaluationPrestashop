import parseTaxRules, { parseTaxRule } from "../XMLUtil/parser/TaxRule.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildTaxRuleXML } from "../XMLUtil/builder/TaxRule.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/tax_rules?output_format=XML&display=${display}`,
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
    return parseTaxRules(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findTaxRulesByGroupId = async (groupId) => {
  try {
    const params = new URLSearchParams({
      "filter[id_tax_rules_group]": `[${groupId}]`,
      output_format: "XML",
      display: "full",
    });

    const queryString = params
      .toString()
      .replace(/%5B/g, "[")
      .replace(/%5D/g, "]");

    const response = await fetch(`${API_URL()}/tax_rules?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseTaxRules(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const postTaxRule = async (taxRule) => {
  const xml = buildTaxRuleXML(taxRule);
  try {
    const response = await fetch(`${API_URL()}/tax_rules?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseTaxRule(xmlText);
    return { success: true, id: created?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const deleteTaxRule = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/tax_rules/${id}`, {
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

export const resetTaxRules = async () => {
  try {
    const taxRules = await getAll();

    if (!taxRules || taxRules.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < taxRules.length; i += chunkSize) {
      const chunk = taxRules.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((taxRule) => deleteTaxRule(taxRule.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};
