import { HomeCategoryShowcase } from "@/components/HomeCategoryShowcase";
import { HomeHero } from "@/components/HomeHero";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="inicio"><HomeHero /></main>
      <HomeCategoryShowcase />
    </div>
  );
}
