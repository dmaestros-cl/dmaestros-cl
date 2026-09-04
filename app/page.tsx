import Image from "next/image";
import { MobileHeroCarousel } from "@/components/MobileHeroCarousel";
import { DesktopHeroCarousel } from "@/components/DesktopHeroCarousel";
import { HomeCategoryShowcase } from "@/components/HomeCategoryShowcase";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="inicio" className="hero">
        <MobileHeroCarousel />
        <Image className="hero-image hero-mobile" src="/images/hero-workshop.png" alt="Mueble de madera con juguetes artesanales y un florero" fill priority sizes="(max-width: 899px) 100vw, 0px" />
        <DesktopHeroCarousel />
      </main>
      <HomeCategoryShowcase />
    </div>
  );
}
