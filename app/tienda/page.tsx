import type { Metadata } from "next";
import Link from "next/link";
import { ShopCatalog } from "@/components/ShopCatalog";
import { ProductSearch } from "@/components/ProductSearch";
import { ResponsiveCategoryNav, type CategoryNavLink } from "@/components/ResponsiveCategoryNav";

export const metadata: Metadata = {
  title: "Tienda | DMaestros",
  description: "Catálogo de muebles y productos artesanales de madera DMaestros.",
};

function ShopIcon({ name }: { name: "pin" | "user" | "cart" }) {
  const paths = {
    pin: <><path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 22c.5-6 3-9 8-9s7.5 3 8 9"/></>,
    cart: <><path d="M2 3h3l2.3 12.5h10.8L21 7H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

const navigation: CategoryNavLink[] = [
  { label: "Tienda", href: "/tienda" }, { label: "Muebles", href: "/tienda?categoria=Muebles#catalogo" }, { label: "Comedores", href: "/tienda?categoria=Comedores#catalogo" },
  { label: "Cavas y bares", href: "/tienda?categoria=Cavas%20y%20bares#catalogo" }, { label: "Cajas para corchos", href: "/tienda?categoria=Cajas%20para%20corchos#catalogo" }, { label: "Cajas mixtas", href: "/tienda?categoria=Cajas%20mixtas#catalogo" },
  { label: "Cajas decorativas", href: "/tienda?categoria=Cajas%20decorativas#catalogo" }, { label: "Cajas de entretención", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo" }, { label: "Juegos de cerveza", href: "/tienda?categoria=Juegos%20de%20cerveza#catalogo" },
  { label: "Juguete lúdico decorativo", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo" }, { label: "Coffee Bar", href: "/tienda?categoria=Coffee%20Bar#catalogo" }, { label: "Mascotas", href: "/tienda?categoria=Mascotas#catalogo" }, { label: "Pedidos especiales", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial" },
];

export default async function StorePage({ searchParams }: { searchParams: Promise<{ categoria?: string; buscar?: string }> }) {
  const { categoria, buscar } = await searchParams;

  return (
    <div className="shop-shell">
      <header className="shop-site-header">
        <div className="shop-topbar">
          <Link className="shop-logo" href="/" aria-label="DMaestros, inicio">
            <svg viewBox="0 0 1348 328" role="img" aria-label="DMaestros">
              <filter id="shop-white-logo" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1 -1 -1 0 2.94" />
              </filter>
              <image href="/images/logo-dmaestros.png" width="1348" height="328" filter="url(#shop-white-logo)" />
            </svg>
          </Link>
          <span className="shop-logo-divider" aria-hidden="true" />
          <strong>store</strong>
          <ProductSearch shop />
          <nav className="shop-header-actions" aria-label="Accesos rápidos">
            <a href="#catalogo"><ShopIcon name="pin" /><span>Tienda</span></a>
            <a href="/tienda"><ShopIcon name="user" /><span>Mi cuenta</span></a>
            <a href="#catalogo"><ShopIcon name="cart" /><span>Carro</span></a>
          </nav>
        </div>
        <ResponsiveCategoryNav links={navigation} className="shop-category-nav" ariaLabel="Categorías de la tienda" />
      </header>
      <div id="catalogo"><ShopCatalog initialCategory={categoria} initialQuery={buscar} /></div>
    </div>
  );
}
