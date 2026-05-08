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

const buildAddresses = (addresses = []) => {
  if (!addresses.length) return "";
  return `
    <addresses>
      ${addresses
        .map((id) => `<address>${field("id", id)}</address>`)
        .join("\n      ")}
    </addresses>`;
};

const buildAssociations = (associations = {}) => {
  const { addresses = [] } = associations;
  const blocks = [buildAddresses(addresses)].filter(Boolean).join("");
  if (!blocks) return "";

  return `
  <associations>
    ${blocks}
  </associations>`;
};

export const buildManufacturerXML = (manufacturer) => {
  const langId = manufacturer.langId ?? 1;
  const name = manufacturer.name ?? "";
  const linkRewrite = manufacturer.linkRewrite ?? toSlug(name);

  const inner = `
  <manufacturer>
    ${manufacturer.id ? field("id", manufacturer.id) : "<!-- POST : pas d'id -->"}

    ${field("name", name)}
    ${optionalField("active", boolValue(manufacturer.active))}
    ${optionalLangField("description", manufacturer.description, langId)}
    ${optionalLangField("short_description", manufacturer.shortDescription, langId)}
    ${optionalLangField("meta_title", manufacturer.metaTitle, langId)}
    ${optionalLangField("meta_description", manufacturer.metaDescription, langId)}
    ${optionalLangField("meta_keywords", manufacturer.metaKeywords, langId)}
    ${langField("link_rewrite", linkRewrite, langId)}

    ${buildAssociations(manufacturer.associations)}
  </manufacturer>`;

  return wrapPrestashop(inner);
};
