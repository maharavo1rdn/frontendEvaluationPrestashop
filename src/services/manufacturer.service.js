import parseManufacturers from "../XMLUtil/parser/Manufacturer.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
  try {
    const response = await fetch(
      `${API_URL()}/manufacturers?output_format=XML&display=${display}`,
      {
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
      },
    );
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    const xmlText = await response.text();
    return parseManufacturers(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteManufacturer = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/manufacturers/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
      },
    });
    if (!response.ok)
      throw new Error(
        `Erreur HTTP ${response.status} — ${response.statusText}`,
      );
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetManufacturers = async () => {
  try {
    const manufacturers = await getAll();
    manufacturers.forEach((manufacturer) => {
      deleteManufacturer(manufacturer.id);
    });
  } catch (error) {
    throw error;
  }
};
