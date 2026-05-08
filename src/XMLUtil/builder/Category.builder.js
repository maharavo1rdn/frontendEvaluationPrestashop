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

const buildCategories = (categories = []) => {
  if (!categories.length) return "";
  return `
    <categories>
      ${categories
        .map((id) => `<category>${field("id", id)}</category>`)
        .join("\n      ")}
    </categories>`;
};

const buildProducts = (products = []) => {
  if (!products.length) return "";
  return `
    <products>
      ${products
        .map((id) => `<product>${field("id", id)}</product>`)
        .join("\n      ")}
    </products>`;
};

const buildAssociations = (associations = {}) => {
  const { categories = [], products = [] } = associations;

  const blocks = [buildCategories(categories), buildProducts(products)]
    .filter(Boolean)
    .join("");

  if (!blocks) return "";

  return `
  <associations>
    ${blocks}
  </associations>`;
};

export const buildCategoryXML = (category) => {
  const langId = category.langId ?? 1;
  const name = category.name ?? "";
  const linkRewrite = category.linkRewrite ?? toSlug(name);

  const inner = `
  <category>
    ${category.id ? field("id", category.id) : "<!-- POST : pas d'id -->"}

    ${field("id_parent", category.idParent ?? 2)}
    ${field("active", boolValue(category.active ?? true) ?? 1)}
    ${optionalField("position", category.position)}
    ${optionalField("is_root_category", boolValue(category.isRootCategory))}

    ${langField("name", name, langId)}
    ${optionalLangField("description", category.description, langId)}
    ${langField("link_rewrite", linkRewrite, langId)}
    ${optionalLangField("meta_title", category.metaTitle, langId)}
    ${optionalLangField("meta_description", category.metaDescription, langId)}
    ${optionalLangField("meta_keywords", category.metaKeywords, langId)}

    ${buildAssociations(category.associations)}
  </category>`;

  return wrapPrestashop(inner);
};
