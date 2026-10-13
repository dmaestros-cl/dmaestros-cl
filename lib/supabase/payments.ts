import "server-only";
import { createClient } from "@supabase/supabase-js";
import { CheckoutError } from "@/lib/webpay-contract";

// This key is exclusively for trusted server payment operations. Never import into a client component.
export function createPaymentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new CheckoutError("El pago en línea aún no está habilitado. Contacta a la tienda.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
