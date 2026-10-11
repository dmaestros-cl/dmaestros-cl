import type { Metadata } from "next";
import { ShopCatalog } from "@/components/ShopCatalog";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicCatalog } from "@/lib/catalog-db";

export const metadata: Metadata = {
  title: "Tienda | DMaestros",
  description: "Catálogo de muebles y productos artesanales de madera DMaestros.",
};

export default async function StorePage({ searchParams }: { searchParams: Promise<{ categoria?: string; buscar?: string }> }) {
  const { categoria, buscar } = await searchParams;
  const catalog = await getPublicCatalog();

  return (
    <div className="shop-shell">
      <SiteHeader />
      <div id="catalogo"><ShopCatalog key={`${categoria ?? ""}-${buscar ?? ""}`} initialCategory={categoria} initialQuery={buscar} products={catalog.products} categories={catalog.categories} whatsappNumber={catalog.whatsappNumber} /></div>
    </div>
  );
}
