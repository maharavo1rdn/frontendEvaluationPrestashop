import { buildCartXML } from "../XMLUtil/builder/Cart.builder";
import parseCarts from "../XMLUtil/parser/Cart.parser";
import { API_URL, WS_KEY, authHeaders } from "../config/config.service";

const DEFAULT_DISPLAY = "full";

export const getAll = async (display = DEFAULT_DISPLAY) => {
	try {
		const response = await fetch(
			`${API_URL()}/carts?output_format=XML&display=${display}`,
			{
				headers: {
					Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
					Accept: "application/xml",
				},
			},
		);
		if (!response.ok)
			throw new Error(
				`Erreur HTTP ${response.status} — ${response.statusText}`,
			);
		const xmlText = await response.text();
		return parseCarts(xmlText);
	} catch (error) {
		throw error;
	}
};

export const postCart = async (cart) => {
	const xml = buildCartXML(cart);
	try {
		const response = await fetch(`${API_URL()}/carts?output_format=XML`, {
			method: "POST",
			headers: authHeaders(),
			body: xml,
		});
		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`HTTP ${response.status} — ${errText}`);
		}
		return { success: true, id: cart.id };
	} catch (err) {
		return { success: false, id: cart.id, error: err.message };
	}
};

export const deleteCart = async (id) => {
	try {
		const response = await fetch(`${API_URL()}/carts/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
			},
		});
		if (!response.ok)
			throw new Error(
				`Erreur HTTP ${response.status} — ${response.statusText}`,
			);
		return response;
	} catch (error) {
		throw error;
	}
};

export const resetCarts = async () => {
	try {
		const carts = await getAll();
		carts.forEach((cart) => {
			deleteCart(cart.id);
		});
	} catch (error) {
		throw error;
	}
};
