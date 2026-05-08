import {
  field,
  langField,
  optionalField,
  wrapPrestashop,
} from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

export const buildProductFeatureValueXML = (value) => {
  const langId = value.langId ?? 1;
  const inner = `
  <product_feature_value>
    ${value.id ? field("id", value.id) : "<!-- POST : pas d'id -->"}

    ${field("id_feature", value.idFeature ?? 0)}
    ${optionalField("custom", boolValue(value.custom))}
    ${langField("value", value.value ?? "", langId)}
  </product_feature_value>`;

  return wrapPrestashop(inner);
};
