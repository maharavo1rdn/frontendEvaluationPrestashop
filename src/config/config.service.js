export const API_URL = () => `${import.meta.env.VITE_API_URL}`;
export const WS_KEY = () => import.meta.env.VITE_WS_KEY;
export const authHeaders = () => ({
  Authorization: `Basic ${btoa(WS_KEY() + ":")}`,
  "Content-Type": "application/xml",
  Accept: "application/xml",
});
