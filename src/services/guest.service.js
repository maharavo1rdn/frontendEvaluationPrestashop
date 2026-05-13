import parseGuests from "../XMLUtil/parser/Guest.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
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
        `Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
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
        Accept: "application/xml",
      },
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
				`Erreur HTTP ${response.status} — ${parseErrors(errText)[0].message || "inconnue" }`,
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetGuests = async () => {
  try {
    const guests = await getAll();
    
    if (!guests || guests.length === 0) {
      return { success: true, deleted: 0 };
    }

    const chunkSize = 10;
    let totalDeleted = 0;

    for (let i = 0; i < guests.length; i += chunkSize) {
      const chunk = guests.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((guest) => deleteGuest(guest.id))
      );
      totalDeleted += results.length;
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    throw error;
  }
};
