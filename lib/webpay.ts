import "server-only";
import { CheckoutError, WEBPAY_PRODUCTION_COMMERCE_CODE, WEBPAY_TOKEN, type WebpayResult } from "./webpay-contract";

export function getWebpayConfig() {
  const environment = process.env.WEBPAY_ENVIRONMENT?.trim();
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE?.trim() || (environment === "production" ? WEBPAY_PRODUCTION_COMMERCE_CODE : "");
  const apiKey = process.env.WEBPAY_API_KEY_SECRET?.trim();
  const siteUrl = process.env.SITE_URL?.trim();
  if ((environment !== "production" && environment !== "integration") || !/^\d{12}$/.test(commerceCode) || !apiKey || !siteUrl) {
    throw new CheckoutError("Webpay aún no está habilitado. Contacta a la tienda para coordinar tu compra.", 503);
  }
  const site = new URL(siteUrl);
  const local = site.hostname === "localhost" || site.hostname === "127.0.0.1";
  if (site.username || site.password || site.pathname !== "/" || site.search || site.hash || (site.protocol !== "https:" && !(local && environment === "integration" && site.protocol === "http:"))) {
    throw new CheckoutError("La dirección de retorno de Webpay no está configurada correctamente.", 503);
  }
  if ((process.env.VERCEL_ENV === "production" && environment === "integration" && process.env.WEBPAY_ALLOW_TEST_ON_PRODUCTION?.trim() !== "true") || (process.env.VERCEL_ENV === "preview" && environment === "production") || (environment === "production" && commerceCode.startsWith("5970555555"))) {
    throw new CheckoutError("La configuración del ambiente de Webpay no es válida.", 503);
  }
  const origin = environment === "production" ? "https://webpay3g.transbank.cl" : "https://webpay3gint.transbank.cl";
  return { environment, commerceCode, apiKey, siteOrigin: site.origin, origin };
}

type Config = ReturnType<typeof getWebpayConfig>;

async function request<T>(config: Config, method: "POST" | "GET" | "PUT", token?: string, body?: object): Promise<T> {
  if (token && !WEBPAY_TOKEN.test(token)) throw new CheckoutError("Token de pago inválido.");
  const response = await fetch(`${config.origin}/rswebpaytransaction/api/webpay/v1.2/transactions${token ? `/${token}` : ""}`, {
    method,
    headers: { "Content-Type": "application/json", "Tbk-Api-Key-Id": config.commerceCode, "Tbk-Api-Key-Secret": config.apiKey },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Never log payment tokens, credentials, customer data or the raw provider response.
    console.error("webpay_provider_error", { method, httpStatus: response.status });
    throw new CheckoutError("No pudimos confirmar la respuesta de Webpay. Revisa el estado antes de volver a pagar.", 502);
  }
  return response.json() as Promise<T>;
}

export async function createWebpay(config: Config, payment: { buy_order: string; session_id: string; amount: number | string }) {
  const result = await request<{ token: string; url: string }>(config, "POST", undefined, {
    buy_order: payment.buy_order,
    session_id: payment.session_id,
    amount: Number(payment.amount),
    return_url: `${config.siteOrigin}/api/payments/webpay/return`,
  });
  const destination = new URL(result.url);
  if (!WEBPAY_TOKEN.test(result.token) || destination.origin !== config.origin || destination.username || destination.password) throw new CheckoutError("Webpay devolvió una respuesta inválida.", 502);
  return result;
}

export const commitWebpay = (config: Config, token: string) => request<WebpayResult>(config, "PUT", token);
export const getWebpayStatus = (config: Config, token: string) => request<WebpayResult>(config, "GET", token);
