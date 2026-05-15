const CUSTOMER_KEY = "frontoffice_customer_session";
const LEGACY_CUSTOMER_KEY = "customer_session";

export const saveCustomerSession = (customer) => {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
};

export const getCustomerSession = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearCustomerSession = () => {
  localStorage.removeItem(CUSTOMER_KEY);
  localStorage.removeItem(LEGACY_CUSTOMER_KEY);
};

const GUEST_KEY = "frontoffice_guest_session";

export const saveGuestSession = (guest) => {
  sessionStorage.setItem(
    GUEST_KEY,
    JSON.stringify({ ...guest, isGuest: true })
  );
};

export const getGuestSession = () => {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearGuestSession = () => {
  sessionStorage.removeItem(GUEST_KEY);
};

export const isGuestSession = () => {
  const guest = getGuestSession();
  return !!(guest?.isGuest && guest?.id);
};

export const getActiveSession = () => {
  const customer = getCustomerSession();
  if (customer?.id) return { ...customer, isGuest: false };
  const guest = getGuestSession();
  if (guest?.id) return { ...guest, isGuest: true };
  return null;
};

export const clearAllSessions = () => {
  clearCustomerSession();
  clearGuestSession();
};
