import { field, optionalField, wrapPrestashop } from "./xml.builder";

const boolValue = (value) =>
	value === undefined || value === null ? undefined : value ? 1 : 0;

const buildCartRows = (rows = []) => {
	if (!rows.length) return "";
	return `
		<cart_rows>
			${rows
				.map(
					(row) => `<cart_row>
				${optionalField("id", row.id)}
				${field("id_product", row.idProduct ?? 0)}
				${field("id_product_attribute", row.idProductAttribute ?? 0)}
				${field("id_address_delivery", row.idAddressDelivery ?? 0)}
				${field("quantity", row.quantity ?? 1)}
				${optionalField("id_customization", row.idCustomization)}
			</cart_row>`
				)
				.join("\n      ")}
		</cart_rows>`;
};

const buildAssociations = (associations = {}) => {
	const { cartRows = [] } = associations;
	const blocks = [buildCartRows(cartRows)].filter(Boolean).join("");
	if (!blocks) return "";

	return `
	<associations>
		${blocks}
	</associations>`;
};

export const buildCartXML = (cart) => {
	const allowSeperatedPackage =
		cart.allowSeperatedPackage ?? cart.allowSeparatedPackage;

	const inner = `
	<cart>
		${cart.id ? field("id", cart.id) : "<!-- POST : pas d'id -->"}

		${field("id_address_delivery", cart.idAddressDelivery ?? 0)}
		${field("id_address_invoice", cart.idAddressInvoice ?? 0)}
		${field("id_currency", cart.idCurrency ?? 0)}
		${field("id_customer", cart.idCustomer ?? 0)}
		${optionalField("id_guest", cart.idGuest)}
		${field("id_lang", cart.idLang ?? 1)}
		${optionalField("id_shop", cart.idShop)}
		${optionalField("id_shop_group", cart.idShopGroup)}
		${optionalField("id_carrier", cart.idCarrier)}
		${optionalField("delivery_option", cart.deliveryOption)}
		${optionalField("secure_key", cart.secureKey)}
		${optionalField("recyclable", boolValue(cart.recyclable))}
		${optionalField("gift", boolValue(cart.gift))}
		${optionalField("gift_message", cart.giftMessage)}
		${optionalField("mobile_theme", boolValue(cart.mobileTheme))}
		${optionalField(
			"allow_seperated_package",
			boolValue(allowSeperatedPackage),
		)}

		${buildAssociations(cart.associations)}
	</cart>`;

	return wrapPrestashop(inner);
};
