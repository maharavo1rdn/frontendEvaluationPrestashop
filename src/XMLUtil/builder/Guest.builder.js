import { field, wrapPrestashop } from "./xml.builder";

export const buildGuestXML = (data = {}) => {
  const b = (val) => (val ? "1" : "0");
  const n = (val, fallback = 0) =>
    val !== undefined && val !== null ? val : fallback;

  return wrapPrestashop(`  <guest>
    ${field("id_customer", n(data.idCustomer, 0))}
    ${field("id_operating_system", 0)}
    ${field("id_web_browser", 0)}
    ${field("javascript", b(data.javascript))}
    ${field("screen_resolution_x", n(data.screenResolutionX, 0))}
    ${field("screen_resolution_y", n(data.screenResolutionY, 0))}
    ${field("screen_color", n(data.screenColor, 0))}
    ${field("sun_java", b(data.sunJava))}
    ${field("adobe_flash", b(data.adobeFlash))}
    ${field("adobe_director", b(data.adobeDirector))}
    ${field("apple_quicktime", b(data.appleQuicktime))}
    ${field("real_player", b(data.realPlayer))}
    ${field("windows_media", b(data.windowsMedia))}
    ${field("accept_language", data.acceptLanguage ?? "fr")}
    ${field("mobile_theme", b(data.mobileTheme))}
  </guest>`);
};
