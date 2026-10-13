import "server-only";
import { createPaymentClient } from "@/lib/supabase/payments";
import { renderOrderEmail, type OrderEmailData } from "@/lib/order-email-template";

const validEmail = (value: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

// Payment confirmation is independent of email delivery. No card tokens/PAN/CVV enter a message.
export async function sendOrderNotifications(orderId: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    const admin = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    const site = process.env.SITE_URL?.trim();
    if (!apiKey || !from || !admin || !validEmail(admin) || !site) throw new Error("email_configuration_missing");
    const db = createPaymentClient();
    const { data: order, error: orderError } = await db.from("orders").select("order_number,customer_name,customer_email,customer_phone,shipping_address,shipping_region,shipping_commune,shipping_cost,total,created_at").eq("id", orderId).eq("payment_status", "authorized").eq("payment_environment", "production").maybeSingle();
    if (orderError) throw new Error("email_order_unavailable");
    if (!order) return;
    if (!validEmail(order.customer_email)) throw new Error("email_recipient_invalid");
    const [{ data: items, error: itemError }, { data: payment, error: paymentError }] = await Promise.all([
      db.from("order_items").select("sku,product_name,unit_price,quantity").eq("order_id", orderId).order("created_at").order("id"),
      db.from("webpay_transactions").select("environment,authorization_code,payment_type_code,card_last_four,transaction_date,installments_number").eq("order_id", orderId).eq("state", "authorized").single(),
    ]);
    if (itemError || paymentError || !items?.length || !payment) throw new Error("email_details_unavailable");
    for (const audience of ["customer", "admin"] as const) {
      const payload = { from, to: [audience === "customer" ? order.customer_email : admin], reply_to: audience === "customer" ? admin : order.customer_email,
        ...renderOrderEmail({ ...order, items, payment } as OrderEmailData, audience, site) };
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: job, error: claimError } = await db.rpc("claim_order_email", { p_order_id: orderId, p_audience: audience, p_payload: payload });
        if (claimError) { console.error("order_email_claim_failed", { orderId, audience }); break; }
        if (!job) break;
        let failure = "provider_network_error";
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `order-confirmation/${orderId}/${audience}/v1` },
            body: JSON.stringify(job.payload), signal: AbortSignal.timeout(10000),
          });
          const result = await response.json();
          if (response.ok && typeof result.id === "string") {
            const { error } = await db.from("order_email_notifications").update({ state: "sent", provider_id: result.id, sent_at: new Date().toISOString(), locked_until: null, last_error: null }).eq("order_id", orderId).eq("audience", audience);
            if (error) console.error("order_email_delivery_record_failed", { orderId, audience });
            break;
          }
          failure = `provider_http_${response.status}`;
          const retryable = response.status === 429 || response.status >= 500 || (response.status === 409 && result.name === "concurrent_idempotent_requests");
          await db.from("order_email_notifications").update({ state: retryable ? "failed" : "review", locked_until: null, last_error: failure }).eq("order_id", orderId).eq("audience", audience);
          console.error("order_email_send_failed", { orderId, audience, code: failure });
          if (!retryable) break;
        } catch {
          await db.from("order_email_notifications").update({ state: "failed", locked_until: null, last_error: failure }).eq("order_id", orderId).eq("audience", audience);
          console.error("order_email_send_failed", { orderId, audience, code: failure });
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  } catch {
    console.error("order_notifications_unavailable", { orderId });
  }
}
