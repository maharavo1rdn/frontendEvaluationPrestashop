import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildStockAvailableXML = (stock) => {
  const inner = `
  <stock_available>
    ${stock.id ? field("id", stock.id) : "<!-- POST : pas d'id -->"}

    ${field("id_product", stock.idProduct ?? 0)}
    ${optionalField("id_product_attribute", stock.idProductAttribute ?? 0)}
    ${optionalField("id_shop", stock.idShop ?? 0)}
    ${optionalField("id_shop_group", stock.idShopGroup)}
    ${field("quantity", stock.quantity ?? 0)}
    ${field("depends_on_stock", boolValue(stock.dependsOnStock) ?? 0)}
    ${field("out_of_stock", stock.outOfStock ?? 2)}
    ${optionalField("location", stock.location)}
  </stock_available>`;

  return wrapPrestashop(inner);
};
