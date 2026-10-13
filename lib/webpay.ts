import "server-only";
import { CheckoutError, WEBPAY_TOKEN, type WebpayResult } from "./webpay-contract";
import { readWebpaySettings } from "./webpay-settings";

export function getWebpayConfig(checkout = false) {
  try { return readWebpaySettings(process.env, checkout); }
  catch (error) { throw new CheckoutError(error instanceof Error ? error.message : "Webpay no está disponible.", 503); }
}

type Config = ReturnType<typeof getWebpayConfig>;

// Public checkout only accepts real commerce credentials. Historical callbacks
// retain getWebpayConfig so certification records can still be reconciled.
export function getCheckoutWebpayConfig() {
  return getWebpayConfig(true);
}

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
