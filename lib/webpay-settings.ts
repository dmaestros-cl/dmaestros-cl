type Environment = Record<string, string | undefined>;
const unavailable = "Webpay aún no está habilitado. Contacta a la tienda para coordinar tu compra.";

// Pure configuration validation: safe to exercise without connecting to Transbank.
export function readWebpaySettings(env: Environment, checkout = false) {
  const environment = env.WEBPAY_ENVIRONMENT?.trim();
  const commerceCode = env.WEBPAY_COMMERCE_CODE?.trim() || (environment === "production" ? "597053098347" : "");
  const apiKey = env.WEBPAY_API_KEY_SECRET?.trim();
  const siteUrl = env.SITE_URL?.trim();
  if ((environment !== "production" && environment !== "integration") || !/^\d{12}$/.test(commerceCode) || !apiKey || !siteUrl) throw new Error(unavailable);
  if (checkout && environment !== "production") throw new Error("El pago en línea aún no está disponible. Contacta a DMaestros para coordinar tu compra.");
  const site = new URL(siteUrl);
  const local = site.hostname === "localhost" || site.hostname === "127.0.0.1";
  if (site.username || site.password || site.pathname !== "/" || site.search || site.hash || (site.protocol !== "https:" && !(local && environment === "integration" && site.protocol === "http:"))) {
    throw new Error("La dirección de retorno de Webpay no está configurada correctamente.");
  }
  const sandboxKey = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";
  if ((env.VERCEL_ENV === "production" && environment === "integration" && env.WEBPAY_ALLOW_TEST_ON_PRODUCTION?.trim() !== "true") || (env.VERCEL_ENV === "preview" && environment === "production") || (environment === "production" && (commerceCode.startsWith("5970555555") || apiKey === sandboxKey))) {
    throw new Error("La configuración del ambiente de Webpay no es válida.");
  }
  const origin = environment === "production" ? "https://webpay3g.transbank.cl" : "https://webpay3gint.transbank.cl";
  return { environment, commerceCode, apiKey, siteOrigin: site.origin, origin };
}
