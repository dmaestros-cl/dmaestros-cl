import { after, NextRequest, NextResponse } from "next/server";
import { sendOrderNotifications } from "@/lib/order-notifications";
import { createPaymentClient } from "@/lib/supabase/payments";
import { UUID } from "@/lib/webpay-contract";
import { getWebpayConfig } from "@/lib/webpay";
import { checkSameOrigin, finalizePayment, PAYMENT_HEADERS, RECEIPT_COOKIE, type Payment } from "@/lib/webpay-payment";

export async function POST(request: NextRequest) {
  try {
    checkSameOrigin(request, getWebpayConfig().siteOrigin);
    const receipt = request.cookies.get(RECEIPT_COOKIE)?.value;
    if (!receipt || !UUID.test(receipt)) return new Response("Comprobante no disponible.", { status: 404, headers: PAYMENT_HEADERS });
    const { data, error } = await createPaymentClient().from("webpay_transactions").select("*").eq("receipt_id", receipt).maybeSingle();
    if (error || !data) throw new Error("Receipt unavailable");
    const payment = data as Payment;
    if (payment.token) await finalizePayment(payment, payment.return_event ?? "error");
    after(() => sendOrderNotifications(payment.order_id));
  } catch {
    console.error("webpay_status_verification_failed");
  }
  return new NextResponse(null, { status: 303, headers: { ...PAYMENT_HEADERS, Location: "/checkout/resultado" } });
}
export const maxDuration = 120;
