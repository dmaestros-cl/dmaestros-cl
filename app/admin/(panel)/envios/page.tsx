import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminShippingManager, type ShippingRate, type ShippingRegion } from "@/components/AdminShippingManager";
import { requireAdmin } from "@/lib/admin";

export default async function ShippingPage() {
  const { supabase } = await requireAdmin();
  const [{ data: regions }, { data: rates }] = await Promise.all([
    supabase.from("shipping_regions").select("code,name,sort_order").order("sort_order"),
    supabase.from("shipping_rates").select("commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max,active").order("commune_name"),
  ]);
  return <>
    <AdminPageHeader eyebrow="Logística" title="Envíos" description="Edita tarifas, plazos y disponibilidad para las 346 comunas de Chile." />
    <AdminShippingManager regions={(regions ?? []) as ShippingRegion[]} initialRates={(rates ?? []).map((rate) => ({ ...rate, price: Number(rate.price) })) as ShippingRate[]} />
  </>;
}
