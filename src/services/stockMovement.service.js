import parseStockMovements from "../XMLUtil/parser/StockMovement.parser";
import { API_URL, authHeaders } from "../config/config.service";

export const findStockMovementsByStockAvailables = async (stockAvailables) => {
  if (!stockAvailables || stockAvailables.length === 0) return [];

  const stockIds = stockAvailables.map((s) => s.id).join("|");

  try {
    const response = await fetch(
      `${API_URL()}/stock_movements?filter[id_stock]=[${stockIds}]&display=full`,
      { headers: authHeaders() }
    );

    if (!response.ok) return [];
    const xmlText = await response.text();
    return parseStockMovements(xmlText);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return [];
  }
};
