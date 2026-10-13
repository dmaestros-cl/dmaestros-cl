import { getCheckoutWebpayConfig } from "@/lib/webpay";
import { PAYMENT_HEADERS } from "@/lib/webpay-payment";

export function GET() {
  try {
    getCheckoutWebpayConfig();
    return Response.json({ enabled: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) }, { headers: PAYMENT_HEADERS });
  } catch {
    return Response.json({ enabled: false }, { headers: PAYMENT_HEADERS });
  }
}
