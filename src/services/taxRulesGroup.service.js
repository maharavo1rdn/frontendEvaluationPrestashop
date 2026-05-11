import parseTaxRulesGroups, {
  parseTaxRulesGroup,
} from "../XMLUtil/parser/TaxRulesGroup.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildTaxRulesGroupXML } from "../XMLUtil/builder/TaxRulesGroup.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/tax_rules_groups?output_format=XML&display=${display}`,
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
    return parseTaxRulesGroups(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findTaxRulesGroupByKeyValue = async (key, value) => {
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
    const response = await fetch(`${API_URL()}/tax_rules_groups?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseTaxRulesGroups(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const postTaxRulesGroup = async (group) => {
  const xml = buildTaxRulesGroupXML(group);
  try {
    const response = await fetch(
      `${API_URL()}/tax_rules_groups?output_format=XML`,
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
    const created = parseTaxRulesGroup(xmlText);
    return { success: true, name: group.name, id: created?.id };
  } catch (err) {
    return { success: false, name: group.name, error: err.message };
  }
};
