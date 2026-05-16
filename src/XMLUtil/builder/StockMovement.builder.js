import { field, optionalField, wrapPrestashop } from "./xml.builder";
export const buildStockMvtXML = (mvt) => {
  let productNameXml = "";
  if (mvt.productName && typeof mvt.productName === "object") {
    for (const [idLang, name] of Object.entries(mvt.productName)) {
      productNameXml += `
    <product_name>
      <language id="${idLang}"><![CDATA[${name}]]></language>
    </product_name>`;
    }
  }

  const inner = `
  <stock_mvt>
    ${mvt.id ? field("id", mvt.id) : "<!-- POST : pas d'id -->"}
    ${optionalField("id_product", mvt.idProduct)}
    ${optionalField("id_product_attribute", mvt.idProductAttribute ?? 0)}
    ${optionalField("id_warehouse", mvt.idWarehouse)}
    ${optionalField("id_currency", mvt.idCurrency)}
    ${optionalField("management_type", mvt.managementType)}
    ${field("id_employee", mvt.idEmployee)}
    ${field("id_stock", mvt.idStock)}
    ${field("id_stock_mvt_reason", mvt.idStockMvtReason)}
    ${optionalField("id_order", mvt.idOrder)}
    ${optionalField("id_supply_order", mvt.idSupplyOrder)}
    ${productNameXml}
    ${optionalField("ean13", mvt.ean13)}
    ${optionalField("upc", mvt.upc)}
    ${optionalField("reference", mvt.reference)}
    ${optionalField("mpn", mvt.mpn)}
    ${field("physical_quantity", mvt.physicalQuantity)}
    ${field("sign", mvt.sign)}
    ${optionalField("last_wa", mvt.lastWa)}
    ${optionalField("current_wa", mvt.currentWa)}
    ${field("price_te", mvt.priceTe)}
    ${field("date_add", mvt.dateAdd)}
  </stock_mvt>`;
  
  return wrapPrestashop(inner);
};