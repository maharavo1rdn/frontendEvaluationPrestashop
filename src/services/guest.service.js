import parseGuests from "../XMLUtil/parser/Guest.parser";
import { API_URL, WS_KEY } from "../config/config.service";

const DEFAULT_DISPLAY = "full";
export const getAll = async () => {
  try {
    const response = await fetch(
      `${API_URL()}/guests?output_format=XML&display=${DEFAULT_DISPLAY}`,
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
    return parseGuests(xmlText);
  } catch (error) {
    throw error;
  }
};

export const deleteGuest = async (id) => {
  try {
    const response = await fetch(`${API_URL()}/guests/${id}`, {
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

export const resetGuests = async () => {
  try {
    const guests = await getAll();
    guests.forEach((guest) => {
      deleteGuest(guest.id);
    });
  } catch (error) {
    throw error;
  }
};
