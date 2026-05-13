import { parseZipFile } from "./zip.service";
import { findProductByKeyValue } from "../product.service";
import { postProductImage } from "../productImage.service";

/**
 * Importe les images produits depuis un fichier .zip.
 *
 * Règle de nommage :
 *   nom_du_fichier_sans_extension  =  référence produit
 *   Exemples : T_01.png → référence T_01
 *              C_03.jpeg → référence C_03
 *
 * @param {File}     file        - Fichier .zip sélectionné
 * @param {Function} onProgress  - Callback après chaque image
 *   → onProgress({ done: number, total: number, result: Object })
 *
 * @returns {Promise<{ success: Object[], errors: Object[] }>}
 */
export const importProductImagesFromZip = async (file, onProgress) => {
  // 1. Extraire toutes les images du zip
  const entries = await parseZipFile(file);
  const total = entries.length;

  if (total === 0) {
    return {
      success: [],
      errors: [
        { name: file.name, error: "Aucune image valide trouvée dans le zip." },
      ],
    };
  }

  const successes = [];
  const errors = [];
  let processedCount = 0;

  // 2. Pour chaque image, trouver le produit et uploader
  for (const entry of entries) {
    let processResult = null;

    try {
      // Trouver le produit par sa référence
      const products = await findProductByKeyValue(
        "reference",
        entry.reference
      );

      if (!products.length) {
        throw new Error(
          `Produit avec la référence "${entry.reference}" introuvable`
        );
      }

      const product = products[0];

      // Uploader l'image vers PrestaShop
      const uploaded = await postProductImage(product.id, entry.file);

      if (!uploaded.success) {
        throw new Error(uploaded.error || "Upload impossible");
      }

      processResult = {
        success: true,
        name: entry.filename,
        reference: entry.reference,
        productId: product.id,
        imageId: uploaded.id,
      };

      successes.push(processResult);
    } catch (error) {
      processResult = {
        success: false,
        name: entry.filename,
        reference: entry.reference,
        error: error.message,
      };
      errors.push(processResult);
    }

    processedCount++;
    onProgress?.({ done: processedCount, total, result: processResult });
  }

  return { success: successes, errors };
};

export default importProductImagesFromZip;
