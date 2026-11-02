import { AdminBlueShipping } from "@/components/AdminBlueShipping";
import { BLUE_RATE_COLUMNS, type BlueTariff } from "@/lib/blue-shipping";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminShippingManager, type ShippingRate, type ShippingRegion } from "@/components/AdminShippingManager";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { AdminFreeShippingSettings } from "@/components/AdminFreeShippingSettings";
import { AdminShippingRules } from "@/components/AdminShippingRules";
import { parseShippingRules, SHIPPING_RULES_COLUMNS, type ShippingRules } from "@/lib/product-shipping-price";
import { parseShippingSettings, SHIPPING_SETTINGS_COLUMNS, type ShippingSettings } from "@/lib/shipping-policy";

export default async function ShippingPage() {
  const { supabase } = await requireAdmin();
  const [{ data: regions }, { data: rates }, settingsResult, tariffsResult] = await Promise.all([
    supabase.from("shipping_regions").select("code,name,sort_order").order("sort_order"),
    supabase.from("shipping_rates").select(`commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max,active,${BLUE_RATE_COLUMNS}`).order("commune_name"),
    supabase.from("shipping_settings").select(`${SHIPPING_SETTINGS_COLUMNS},${SHIPPING_RULES_COLUMNS},origin_commune_code`).eq("id", true).single(),
    supabase.from("blue_pyme_tariffs").select("region_code,xs,s,m,l").order("region_code"),
  ]);
  let settings: ShippingSettings | null = null;
  let rules: ShippingRules | null = null;
  if (!settingsResult.error) {
    try { settings = parseShippingSettings(settingsResult.data); } catch { /* Show the unavailable state, never a fake saved setting. */ }
    try { rules = parseShippingRules(settingsResult.data); } catch { /* Show the unavailable state. */ }
  }
  return <>
    <AdminPageHeader eyebrow="Logística" title="Envíos" description="Configura el origen, las tarifas por peso y las excepciones por comuna. Ingresa las medidas del embalaje en cada producto." action={<Link className="admin-secondary-button" href="/admin/productos">Tarifas por producto</Link>} />
    <AdminBlueShipping regions={(regions ?? []) as ShippingRegion[]} communes={rates ?? []} initialTariffs={tariffsResult.error ? null : tariffsResult.data as BlueTariff[]} initialOrigin={settingsResult.data?.origin_commune_code ?? null} />
    <AdminShippingRules initialRules={rules} />
    <AdminFreeShippingSettings initialSettings={settings} />
    <AdminShippingManager regions={(regions ?? []) as ShippingRegion[]} initialRates={(rates ?? []).map((rate) => ({ ...rate, price: Number(rate.price) })) as ShippingRate[]} />
  </>;
}
