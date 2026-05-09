import {
	parseXML,
	getValue,
	getInteger,
	getBoolean,
	toArray,
} from "./xml.parser";

export const mapCart = (cartNode) => ({
	id: getValue(cartNode.id),
	idAddressDelivery: getValue(cartNode.id_address_delivery),
	idAddressInvoice: getValue(cartNode.id_address_invoice),
	idCurrency: getValue(cartNode.id_currency),
	idCustomer: getValue(cartNode.id_customer),
	idGuest: getValue(cartNode.id_guest),
	idLang: getValue(cartNode.id_lang),
	idShop: getValue(cartNode.id_shop),
	idShopGroup: getValue(cartNode.id_shop_group),
	idCarrier: getValue(cartNode.id_carrier),
	deliveryOption: getValue(cartNode.delivery_option),
	secureKey: getValue(cartNode.secure_key),
	recyclable: getBoolean(cartNode.recyclable),
	gift: getBoolean(cartNode.gift),
	giftMessage: getValue(cartNode.gift_message),
	mobileTheme: getBoolean(cartNode.mobile_theme),
	allowSeperatedPackage: getBoolean(cartNode.allow_seperated_package),
	dateAdd: getValue(cartNode.date_add),
	dateUpd: getValue(cartNode.date_upd),
	associations: {
		cartRows: toArray(cartNode?.associations?.cart_rows?.cart_row).map(
			(row) => ({
				id: getValue(row.id),
				idProduct: getValue(row.id_product),
				idProductAttribute: getValue(row.id_product_attribute),
				idAddressDelivery: getValue(row.id_address_delivery),
				quantity: getInteger(row.quantity),
				idCustomization: getValue(row.id_customization),
			}),
		),
	},
});

export const parseCart = (xmlString) => {
	const result = parseXML(xmlString);
	const raw = result?.prestashop?.cart;
	return mapCart(raw);
};

const parseCarts = (xmlString) => {
	const result = parseXML(xmlString);
	const raw = result?.prestashop?.carts?.cart;
	return toArray(raw).map(mapCart);
};

export default parseCarts;
