import { PrimaryHero } from "@/components/PrimaryHero";
import { heroSlides, type HeroSlide } from "@/lib/hero-slides";
import { createClient } from "@/lib/supabase/server";

export async function HomeHero() {
  let slides: HeroSlide[] = heroSlides;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("hero_slides").select("mobile_image_url,desktop_image_url,alt,title,description,cta,href").eq("active", true).order("sort_order");
    if (data?.length) slides = data.map((slide) => ({ mobileImage: slide.mobile_image_url, desktopImage: slide.desktop_image_url, alt: slide.alt, title: slide.title, description: slide.description, cta: slide.cta, href: slide.href }));
  } catch {
    // The local slide remains available while Supabase is not configured.
  }
  return <PrimaryHero slides={slides} />;
}
