import { after, NextResponse } from "next/server";
import { sendOrderNotifications } from "@/lib/order-notifications";
import { createPaymentClient } from "@/lib/supabase/payments";
import { parseWebpayReturn } from "@/lib/webpay-contract";
import { getWebpayConfig } from "@/lib/webpay";
import { finalizePayment, PAYMENT_HEADERS, RECEIPT_COOKIE, type Payment } from "@/lib/webpay-payment";

async function handleReturn(request: Request) {
  const response = new NextResponse(null, { status: 303, headers: { ...PAYMENT_HEADERS, Location: "/checkout/resultado" } });
  let payment: Payment | null = null;
  try {
    const config = getWebpayConfig();
    let params = new URL(request.url).searchParams;
    if (request.method === "POST") {
      const body = await request.text();
      if (body.length > 4096 || !request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new Error("Invalid return body");
      params = new URLSearchParams(body);
    }
    const parsed = parseWebpayReturn(params);
    let query = createPaymentClient().from("webpay_transactions").select("*")
      .eq("environment", config.environment).eq("commerce_code", config.commerceCode);
    if (parsed.token) query = query.eq("token", parsed.token);
    else query = query.eq("buy_order", parsed.buyOrder!).eq("session_id", parsed.sessionId!);
    const { data, error } = await query.maybeSingle();
    if (error || !data || (parsed.buyOrder && (parsed.buyOrder !== data.buy_order || parsed.sessionId !== data.session_id))) throw new Error("Unknown return");
    payment = data as Payment;
    response.cookies.set(RECEIPT_COOKIE, payment.receipt_id, { httpOnly: true, secure: config.siteOrigin.startsWith("https:"), sameSite: "lax", path: "/", maxAge: 86400 });
    await finalizePayment(payment, parsed.event);
    const orderId = payment.order_id;
    after(() => sendOrderNotifications(orderId));
  } catch {
    console.error("webpay_return_verification_failed", { paymentId: payment?.id ?? "unknown" });
    if (!payment) {
      response.cookies.delete(RECEIPT_COOKIE);
    }
  }
  return response;
}

export const GET = handleReturn;
export const POST = handleReturn;
export const maxDuration = 120;
