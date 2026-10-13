import "server-only";
import { createPaymentClient } from "@/lib/supabase/payments";
import { CheckoutError, matchesPayment, type ReturnEvent } from "@/lib/webpay-contract";
import { commitWebpay, getWebpayConfig, getWebpayStatus } from "@/lib/webpay";

export const RECEIPT_COOKIE = "dmaestros-webpay-receipt";
export const PAYMENT_HEADERS = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" };

export type Payment = {
  id: string;
  receipt_id: string;
  order_id: string;
  buy_order: string;
  session_id: string;
  amount: number | string;
  environment: string;
  commerce_code: string;
  token: string | null;
  redirect_url: string | null;
  state: string;
  return_event: ReturnEvent | null;
  created_at: string;
  created?: boolean;
};

export function checkSameOrigin(request: Request, origin: string) {
  if (request.headers.get("origin") !== origin) throw new CheckoutError("Origen de solicitud no permitido.", 403);
}

export async function finalizePayment(payment: Payment, event: ReturnEvent) {
  if (payment.state === "authorized") return;
  const config = getWebpayConfig();
  if (payment.environment !== config.environment || payment.commerce_code !== config.commerceCode || !payment.token) throw new CheckoutError("No se puede verificar este pago en el ambiente actual.", 409);
  const database = createPaymentClient();
  const now = new Date();
  const { data: locked, error: lockError } = await database.from("webpay_transactions")
    .update({ processing_until: new Date(now.getTime() + 90000).toISOString(), return_event: event })
    .eq("id", payment.id).neq("state", "authorized")
    .or(`processing_until.is.null,processing_until.lt.${now.toISOString()}`).select("id").maybeSingle();
  if (lockError) throw new CheckoutError("No pudimos verificar el pago. Vuelve a consultar su estado.", 503);
  if (!locked) return; // Another callback is already processing this exact transaction.
  try {
    // Query first: after an interrupted commit, never blindly submit it again.
    let result = await getWebpayStatus(config, payment.token);
    if (!matchesPayment(result, payment)) throw new CheckoutError("La respuesta de pago no coincide con el pedido.", 502);
    if (event === "commit" && result.status === "INITIALIZED") {
      try {
        result = await commitWebpay(config, payment.token);
      } catch {
        result = await getWebpayStatus(config, payment.token);
      }
    }
    if (!matchesPayment(result, payment)) throw new CheckoutError("La respuesta de pago no coincide con el pedido.", 502);
    const { error } = await database.rpc("finish_webpay_payment", { p_id: payment.id, p_result: result, p_event: event });
    if (error) throw new CheckoutError("El pago está pendiente de sincronización. Consulta su estado antes de volver a pagar.", 503);
  } finally {
    const { error } = await database.from("webpay_transactions").update({ processing_until: null }).eq("id", payment.id);
    if (error) console.error("webpay_lock_release_failed", { paymentId: payment.id, code: error.code });
  }
}
