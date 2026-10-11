import { HomeCategoryShowcase } from "@/components/HomeCategoryShowcase";
import { HomeHero } from "@/components/HomeHero";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicCatalog } from "@/lib/catalog-db";

export default async function Home() {
  const { products, whatsappNumber } = await getPublicCatalog();
  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="inicio"><HomeHero /></main>
      <HomeCategoryShowcase products={products} whatsappNumber={whatsappNumber} />
    </div>
  );
}
