import parseProductImages, {
  parseProductImage,
} from "../XMLUtil/parser/ProductImage.parser";
import parseErrors from "../XMLUtil/parser/Error.parser";
import { API_URL, WS_KEY } from "../config/config.service";

/**
 * Retourne toutes les images d'un produit.
 * @param {string|number} idProduct
 */
export const getProductImages = async (idProduct) => {
  try {
    const response = await fetch(
      `${API_URL()}/images/products/${idProduct}?output_format=XML`,
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
          parseErrors(errText)?.[0]?.message || "inconnue"
        }`
      );
    }
    const xmlText = await response.text();
    return parseProductImages(xmlText);
  } catch (error) {
    throw error;
  }
};

/**
 * Upload une image pour un produit.
 *
 * L'endpoint PrestaShop est :
 *   POST /api/images/products/{id_product}
 *   Content-Type: multipart/form-data  (champ : "image")
 *
 * @param {string|number} idProduct  - ID du produit cible
 * @param {File}          imageFile  - Fichier image (File ou Blob)
 * @returns {Promise<{ success: boolean, id: string, idProduct: string }>}
 */
export const postProductImage = async (idProduct, imageFile) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile, imageFile.name);

    const response = await fetch(
      `${API_URL()}/images/products/${idProduct}?output_format=XML`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
          Accept: "application/xml",
        },
        body: formData,
      }
    );

    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${xmlText}`);
    }

    const created = parseProductImage(xmlText);
    return { success: true, id: created?.id, idProduct: String(idProduct) };
  } catch (err) {
    return { success: false, idProduct: String(idProduct), error: err.message };
  }
};

/**
 * Supprime une image produit.
 * @param {string|number} idProduct
 * @param {string|number} idImage
 */
export const deleteProductImage = async (idProduct, idImage) => {
  try {
    const response = await fetch(
      `${API_URL()}/images/products/${idProduct}/${idImage}`,
      {
        method: "DELETE",
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
          parseErrors(errText)?.[0]?.message || "inconnue"
        }`
      );
    }
    return response;
  } catch (error) {
    throw error;
  }
};
