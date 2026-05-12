import {
  field,
  langField,
  optionalField,
  optionalLangField,
  wrapPrestashop,
} from "./xml.builder";

export const buildProductOptionValueXML = (productOptionValue) => {
  const langId = productOptionValue.langId ?? 1;
  const name = productOptionValue.name ?? "";

  const inner = `
  <product_option_value>
    ${productOptionValue.id ? field("id", productOptionValue.id) : "<!-- POST : pas d'id -->"}
    
    ${field("id_attribute_group", productOptionValue.idAttributeGroup)}
    ${optionalField("color", productOptionValue.color)}
    ${optionalField("position", productOptionValue.position)}
    ${langField("name", name, langId)}
  </product_option_value>`;

  return wrapPrestashop(inner);
};
