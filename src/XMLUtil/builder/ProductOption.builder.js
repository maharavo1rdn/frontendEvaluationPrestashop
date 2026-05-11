import {
  field,
  langField,
  optionalField,
  optionalLangField,
  wrapPrestashop,
  toSlug,
} from "./xml.builder";

const boolValue = (value) =>
  value === undefined || value === null ? undefined : value ? 1 : 0;

const buildProductOptionValues = (productOptionValues = []) => {
  if (!productOptionValues.length) return "";
  return `
    <product_option_values>
      ${productOptionValues
        .map(
          (id) =>
            `<product_option_value>${field("id", id)}</product_option_value>`
        )
        .join("\n      ")}
    </product_option_values>`;
};

const buildAssociations = (associations = {}) => {
  const { productOptionValues = [] } = associations;

  const blocks = [buildProductOptionValues(productOptionValues)]
    .filter(Boolean)
    .join("");

  if (!blocks) return "";

  return `
  <associations>
    ${blocks}
  </associations>`;
};

export const buildProductOptionXML = (productOption) => {
  const langId = productOption.langId ?? 1;
  const name = productOption.name ?? "";
  const publicName = productOption.publicName ?? "";

  const inner = `
  <product_option>
    ${productOption.id ? field("id", productOption.id) : "<!-- POST : pas d'id -->"}

    ${optionalField("is_color_group", boolValue(productOption.isColorGroup))}
    ${field("group_type", productOption.groupType ?? "")}
    ${optionalField("position", productOption.position)}

    ${langField("name", name, langId)}
    ${langField("public_name", publicName, langId)}

    ${buildAssociations(productOption.associations)}
  </product_option>`;

  return wrapPrestashop(inner);
};
