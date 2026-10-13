import { getWebpayConfig } from "@/lib/webpay";
import { PAYMENT_HEADERS } from "@/lib/webpay-payment";

export function GET() {
  try {
    const config = getWebpayConfig();
    return Response.json({ enabled: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), testMode: config.environment === "integration" }, { headers: PAYMENT_HEADERS });
  } catch {
    return Response.json({ enabled: false, testMode: false }, { headers: PAYMENT_HEADERS });
  }
}
