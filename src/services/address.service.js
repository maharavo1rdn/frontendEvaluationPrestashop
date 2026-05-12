import parseAddresses, { parseAddress } from "../XMLUtil/parser/Address.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { buildAddressXML } from "../XMLUtil/builder/Address.builder";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/addresses?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      }
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${
          parseErrors(errText)[0].message || "inconnue"
        }`
      );
    const xmlText = await response.text();
    return parseAddresses(xmlText);
  } catch (error) {
    throw error;
  }
};

export const findAddressByKeyValue = async (key, value) => {
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
    const response = await fetch(`${API_URL()}/addresses?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
        Accept: "application/xml",
      },
    });
    if (!response.ok) throw new Error(`Erreur: ${await response.text()}`);
    const xmlText = await response.text();
    return parseAddresses(xmlText);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const postAddress = async (address) => {
  const xml = buildAddressXML(address);
  try {
    const response = await fetch(`${API_URL()}/addresses?output_format=XML`, {
      method: "POST",
      headers: authHeaders(),
      body: xml,
    });
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }
    const created = parseAddress(xmlText);
    return {
      success: true,
      id: created?.id,
    };
  } catch (err) {
    return { success: false, id: address.id, error: err.message };
  }
};

export const deleteAddress = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/addresses/${id}`, {
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

export const resetAddresses = async () => {
  const results = { deleted: [], failed: [] };
  const addresses = await getAll();
  try {
    for (const address of addresses) {
      await deleteAddress(address.id);
      results.deleted.push(address.id);
    }
  } catch (error) {
    results.failed.push({ id: address.id, reason: error.message });
  }
  return addresses;
};
