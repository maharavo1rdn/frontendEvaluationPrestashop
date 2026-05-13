import JSZip from "jszip";

const VALID_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

const MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * Extrait les images d'un fichier .zip.
 *
 * @param {File} file - Fichier .zip sélectionné par l'utilisateur
 * @returns {Promise<Array<{
 *   reference: string,   // nom sans extension → référence produit
 *   filename:  string,   // nom complet du fichier
 *   file:      File,     // objet File prêt pour FormData
 *   mimeType:  string,
 * }>>}
 */
export const parseZipFile = async (file) => {
  const zip = await JSZip.loadAsync(file);
  const entries = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    // Ignorer les dossiers et les artéfacts macOS
    if (zipEntry.dir) continue;
    if (path.startsWith("__MACOSX")) continue;
    if (path.startsWith(".")) continue;

    // Nom du fichier sans chemin (supporte les sous-dossiers dans le zip)
    const filename = path.split("/").pop();
    if (!filename) continue;

    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex === -1) continue;

    const extension = filename.slice(dotIndex + 1).toLowerCase();
    if (!VALID_EXTENSIONS.has(extension)) continue;

    // Référence produit = nom sans extension
    const reference = filename.slice(0, dotIndex);
    if (!reference) continue;

    const mimeType = MIME_MAP[extension] ?? "image/jpeg";
    const blob = await zipEntry.async("blob");
    const imageFile = new File([blob], filename, { type: mimeType });

    entries.push({ reference, filename, file: imageFile, mimeType });
  }

  return entries;
};
