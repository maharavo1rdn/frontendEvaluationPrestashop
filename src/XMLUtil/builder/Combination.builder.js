import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

const buildProductOptionValues = (ids = []) => {
  if (!ids.length) return "";
  return `
    <product_option_values>
      ${ids
        .map((id) => `<product_option_value>${field("id", id)}</product_option_value>`)
        .join("\n      ")}
    </product_option_values>`;
};

const buildImages = (ids = []) => {
  if (!ids.length) return "";
  return `
    <images>
      ${ids.map((id) => `<image>${field("id", id)}</image>`).join("\n      ")}
    </images>`;
};

const buildStockAvailables = (stocks = []) => {
  if (!stocks.length) return "";
  return `
    <stock_availables>
      ${stocks
        .map(
          (stock) => `<stock_available>
        ${field("id", stock.id)}
        ${field("id_product_attribute", stock.idProductAttribute ?? 0)}
      </stock_available>`
        )
        .join("\n      ")}
    </stock_availables>`;
};

const buildAssociations = (associations = {}) => {
  const {
    productOptionValues = [],
    images = [],
    stockAvailables = [],
  } = associations;

  const blocks = [
    buildProductOptionValues(productOptionValues),
    buildImages(images),
    buildStockAvailables(stockAvailables),
  ]
    .filter(Boolean)
    .join("");

  if (!blocks) return "";

  return `
  <associations>
    ${blocks}
  </associations>`;
};

export const buildCombinationXML = (combination) => {
  const inner = `
  <combination>
    ${combination.id ? field("id", combination.id) : "<!-- POST : pas d'id -->"}

    ${field("id_product", combination.idProduct ?? 0)}
    ${field("minimal_quantity", combination.minimalQuantity ?? 1)}
    ${optionalField("id_shop", combination.idShop)}
    ${optionalField("reference", combination.reference)}
    ${optionalField("supplier_reference", combination.supplierReference)}
    ${optionalField("location", combination.location)}
    ${optionalField("ean13", combination.ean13)}
    ${optionalField("isbn", combination.isbn)}
    ${optionalField("upc", combination.upc)}
    ${optionalField("mpn", combination.mpn)}
    ${optionalField("wholesale_price", combination.wholesalePrice)}
    ${optionalField("price", combination.price)}
    ${optionalField("ecotax", combination.ecotax)}
    ${optionalField("quantity", combination.quantity)}
    ${optionalField("weight", combination.weight)}
    ${optionalField("unit_price_impact", combination.unitPriceImpact)}
    ${optionalField("default_on", boolValue(combination.defaultOn))}
    ${optionalField("available_date", combination.availableDate)}

    ${buildAssociations(combination.associations)}
  </combination>`;

  return wrapPrestashop(inner);
};
