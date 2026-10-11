import { AdminHeroManager } from "@/components/AdminHeroManager";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminStoreSettings } from "@/components/AdminStoreSettings";
import { AdminSocialSettings } from "@/components/AdminSocialSettings";
import { AdminFooterSettings } from "@/components/AdminFooterSettings";
import { AdminSettingsTabs } from "@/components/AdminSettingsTabs";
import { requireAdmin } from "@/lib/admin";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: slides, error }, { data: settings }, { data: footerSettings }, { data: footerSections }] = await Promise.all([
    supabase.from("hero_slides").select("*").order("sort_order"),
    supabase.from("store_settings").select("whatsapp_number,instagram_url,instagram_active,facebook_url,facebook_active,youtube_url,youtube_active").eq("id", true).maybeSingle(),
    supabase.from("footer_settings").select("business_name,location_text,contact_email,service_text,service_hours").eq("id", true).maybeSingle(),
    supabase.from("footer_sections").select("section_key,title,sort_order,active,footer_links(id,section_key,label,href,sort_order,active)").order("sort_order"),
  ]);
  return <>
    <AdminPageHeader eyebrow="Sitio web" title="Configuración" description="Administra el contenido visual y las opciones generales de DMaestros." />
    <AdminSettingsTabs panels={{
      ventas: <AdminStoreSettings whatsappNumber={settings?.whatsapp_number ?? ""} />,
      redes: <AdminSocialSettings initialSettings={{ instagram_url: settings?.instagram_url ?? "", instagram_active: settings?.instagram_active ?? true, facebook_url: settings?.facebook_url ?? "", facebook_active: settings?.facebook_active ?? true, youtube_url: settings?.youtube_url ?? "", youtube_active: settings?.youtube_active ?? true }} />,
      footer: <AdminFooterSettings initialSettings={footerSettings ?? { business_name: "DMaestros Chile", location_text: "Taller de productos artesanales fabricados en Chile", contact_email: "contacto@dmaestros.cl", service_text: "Atención personalizada", service_hours: "Lunes a viernes" }} initialSections={(footerSections ?? []).map((section) => ({ ...section, links: [...(section.footer_links ?? [])].sort((a, b) => a.sort_order - b.sort_order) }))} />,
      hero: error ? <div className="admin-alert">No fue posible cargar el hero desde Supabase.</div> : <AdminHeroManager slides={slides ?? []} />,
    }} />
  </>;
}
