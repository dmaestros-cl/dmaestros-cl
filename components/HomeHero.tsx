import { PrimaryHero } from "@/components/PrimaryHero";
import { createClient } from "@/lib/supabase/server";

export async function HomeHero() {
  const supabase = await createClient();
  const { data } = await supabase.from("hero_slides").select("mobile_image_url,desktop_image_url,alt,title,description,cta,href,mobile_asset:media_assets!hero_slides_mobile_asset_id_fkey(width,height),desktop_asset:media_assets!hero_slides_desktop_asset_id_fkey(width,height)").eq("active", true).order("sort_order");
  const slides = (data ?? []).map((slide) => ({
    mobileImage: slide.mobile_image_url,
    desktopImage: slide.desktop_image_url,
    mobileSize: (Array.isArray(slide.mobile_asset) ? slide.mobile_asset[0] : slide.mobile_asset) ?? undefined,
    desktopSize: (Array.isArray(slide.desktop_asset) ? slide.desktop_asset[0] : slide.desktop_asset) ?? undefined,
    alt: slide.alt,
    title: slide.title,
    description: slide.description,
    cta: slide.cta,
    href: slide.href,
  }));
  if (!slides.length) return null;
  return <PrimaryHero slides={slides} />;
}
