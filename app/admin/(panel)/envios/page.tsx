import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminShippingManager, type ShippingRate, type ShippingRegion } from "@/components/AdminShippingManager";
import { requireAdmin } from "@/lib/admin";
import { AdminFreeShippingSettings } from "@/components/AdminFreeShippingSettings";
import { parseShippingSettings, SHIPPING_SETTINGS_COLUMNS, type ShippingSettings } from "@/lib/shipping-policy";

export default async function ShippingPage() {
  const { supabase } = await requireAdmin();
  const [{ data: regions }, { data: rates }, settingsResult] = await Promise.all([
    supabase.from("shipping_regions").select("code,name,sort_order").order("sort_order"),
    supabase.from("shipping_rates").select("commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max,active").order("commune_name"),
    supabase.from("shipping_settings").select(SHIPPING_SETTINGS_COLUMNS).eq("id", true).single(),
  ]);
  let settings: ShippingSettings | null = null;
  if (!settingsResult.error) {
    try { settings = parseShippingSettings(settingsResult.data); } catch { /* Show the unavailable state, never a fake saved setting. */ }
  }
  return <>
    <AdminPageHeader eyebrow="Logística" title="Envíos" description="Edita tarifas, plazos y disponibilidad para las 346 comunas de Chile." />
    <AdminFreeShippingSettings initialSettings={settings} />
    <AdminShippingManager regions={(regions ?? []) as ShippingRegion[]} initialRates={(rates ?? []).map((rate) => ({ ...rate, price: Number(rate.price) })) as ShippingRate[]} />
  </>;
}
