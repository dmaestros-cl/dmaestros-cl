import { AdminHeroManager } from "@/components/AdminHeroManager";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { requireAdmin } from "@/lib/admin";
import { heroSlides } from "@/lib/hero-slides";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
  const slides = data?.length ? data : heroSlides.map((slide, index) => ({ id: `local-${index}`, mobile_image_url: slide.mobileImage, desktop_image_url: slide.desktopImage, title: slide.title, description: slide.description, cta: slide.cta, href: slide.href, active: true }));
  return <>
    <AdminPageHeader eyebrow="Sitio web" title="Configuración" description="Administra el contenido visual y las opciones generales de DMaestros." />
    <AdminHeroManager slides={slides} />
  </>;
}
