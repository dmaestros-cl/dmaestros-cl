import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createPaymentClient } from "@/lib/supabase/payments";
import { CheckoutError, parseCheckoutInput } from "@/lib/webpay-contract";
import { createWebpay, getWebpayConfig } from "@/lib/webpay";
import { checkSameOrigin, PAYMENT_HEADERS, RECEIPT_COOKIE, type Payment } from "@/lib/webpay-payment";

export async function POST(request: Request) {
  try {
    const config = getWebpayConfig();
    checkSameOrigin(request, config.siteOrigin);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new CheckoutError("Solicitud inválida.", 415);
    const raw = await request.text();
    if (raw.length > 20000) throw new CheckoutError("Solicitud demasiado grande.", 413);
    let json: unknown;
    try { json = JSON.parse(raw); } catch { throw new CheckoutError("Solicitud inválida."); }
    const input = parseCheckoutInput(json);
    const database = createPaymentClient();
    const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local";
    const clientHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update(ip).digest("hex");
    const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const { data, error } = await database.rpc("create_webpay_order", {
      p_attempt_id: input.attemptId, p_request_hash: requestHash, p_client_hash: clientHash,
      p_customer: input.customer, p_items: input.items, p_region_code: input.regionCode,
      p_commune_code: input.communeCode, p_expected_total: input.expectedTotal,
      p_environment: config.environment, p_commerce_code: config.commerceCode,
    });
    if (error) {
      if (error.message.startsWith("CHECKOUT:")) throw new CheckoutError(error.message.slice(9), 409);
      console.error("webpay_order_create_failed", { code: error.code });
      throw new CheckoutError("No pudimos registrar el pedido. No se ha iniciado ningún cobro.", 503);
    }
    const payment = data as Payment;
    if (!payment || !payment.id) throw new CheckoutError("No se pudo crear el pedido.", 503);
    let token = payment.token;
    let url = payment.redirect_url;
    if (payment.created) {
      const created = await createWebpay(config, payment);
      const { data: saved, error: saveError } = await database.from("webpay_transactions")
        .update({ token: created.token, redirect_url: created.url, state: "initialized", updated_at: new Date().toISOString() })
        .eq("id", payment.id).eq("state", "creating").select("id").single();
      if (saveError || !saved) throw new CheckoutError("No pudimos iniciar el pago. No se ha enviado ningún cobro.", 503);
      token = created.token;
      url = created.url;
    } else if (payment.state !== "initialized" || Date.now() - new Date(payment.created_at).getTime() > (config.environment === "integration" ? 10 : 4) * 60 * 1000) {
      const response = NextResponse.json({ resultUrl: "/checkout/resultado" }, { headers: PAYMENT_HEADERS });
      response.cookies.set(RECEIPT_COOKIE, payment.receipt_id, { httpOnly: true, secure: config.siteOrigin.startsWith("https:"), sameSite: "lax", path: "/", maxAge: 86400 });
      return response;
    }
    if (!url || !token || new URL(url).origin !== config.origin) throw new CheckoutError("Este intento de pago no está disponible. Revisa su estado.", 409);
    const response = NextResponse.json({ token, url }, { headers: PAYMENT_HEADERS });
    response.cookies.set(RECEIPT_COOKIE, payment.receipt_id, { httpOnly: true, secure: config.siteOrigin.startsWith("https:"), sameSite: "lax", path: "/", maxAge: 86400 });
    return response;
  } catch (error) {
    console.error("webpay_checkout_failed", { kind: error instanceof CheckoutError ? "checkout" : "unexpected" });
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : "No pudimos iniciar Webpay. Intenta nuevamente en unos minutos." }, { status: error instanceof CheckoutError ? error.status : 503, headers: PAYMENT_HEADERS });
  }
}
