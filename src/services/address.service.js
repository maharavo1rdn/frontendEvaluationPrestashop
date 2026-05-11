import parseAddresses from "../XMLUtil/parser/Address.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY } from "../config/config.service";

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
