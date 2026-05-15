import { findAddressByKeyValue, postAddress } from "../address.service";
import { findCustomerByKeyValue, postCustomer } from "../customer.service";

const GUEST_EMAIL = "guest@gmail.com";

const GUEST_CUSTOMER_PAYLOAD = {
  firstname: "guest",
  lastname: "prestashop",
  email: GUEST_EMAIL,
  passwd: "guest1234",
  idLang: 1,
  idShopGroup: 1,
  idShop: 1,
  newsletter: false,
  optin: false,
  active: true,
  deleted: false,
  isGuest: false,
};

const buildGuestAddressPayload = (idCustomer) => ({
  idCustomer,
  alias: "Adresse principale",
  idState: 1,
  idCountry: 8,
  firstname: "guest",
  lastname: "prestashop",
  address1: "Addresse principeale",
  city: "Antananarivo",
  postcode: "75002",
  phone: "0000000000",
});

const toGuestSession = (customer) => ({
  id: customer.id,
  email: customer.email ?? GUEST_EMAIL,
  firstname: customer.firstname ?? "guest",
  lastname: customer.lastname ?? "prestashop",
  idLang: customer.idLang ?? 1,
  secureKey: customer.secureKey ?? "",
  isGuest: true,
});

export const ensureStaticGuestCustomer = async () => {
  const customers = await findCustomerByKeyValue("email", GUEST_EMAIL);
  let customer = customers?.[0] ?? null;

  if (!customer?.id) {
    const createdCustomer = await postCustomer(GUEST_CUSTOMER_PAYLOAD);
    if (!createdCustomer?.success || !createdCustomer?.id) {
      throw new Error(
        createdCustomer?.error || "Impossible de créer le compte guest."
      );
    }

    customer = {
      ...GUEST_CUSTOMER_PAYLOAD,
      id: createdCustomer.id,
      secureKey: createdCustomer.secureKey,
    };
  }

  const addresses = await findAddressByKeyValue("id_customer", customer.id);
  if (!addresses?.length) {
    const createdAddress = await postAddress(
      buildGuestAddressPayload(customer.id)
    );
    if (!createdAddress?.success || !createdAddress?.id) {
      throw new Error(
        createdAddress?.error || "Impossible de créer l'adresse du guest."
      );
    }
  }

  return toGuestSession(customer);
};
