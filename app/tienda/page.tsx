import type { Metadata } from "next";
import Link from "next/link";
import { ShopCatalog } from "@/components/ShopCatalog";

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

const navigation = [
  ["Tienda", "/tienda"], ["Muebles", "/tienda#catalogo"], ["Cavas y bares", "/tienda#catalogo"],
  ["Cajas para corchos", "/tienda#catalogo"], ["Cajas mixtas", "/tienda#catalogo"], ["Juegos de cerveza", "/tienda#catalogo"],
  ["Coffee Bar", "/tienda#catalogo"], ["Pedidos especiales", "/#whatsapp"],
];

export default function StorePage() {
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
          <label className="shop-header-search"><span className="sr-only">Buscar</span><input placeholder="Buscar..." /></label>
          <nav className="shop-header-actions" aria-label="Accesos rápidos">
            <a href="#catalogo"><ShopIcon name="pin" /><span>Tienda</span></a>
            <a href="/#whatsapp"><ShopIcon name="user" /><span>Mi cuenta</span></a>
            <a href="#catalogo"><ShopIcon name="cart" /><span>Carro</span></a>
          </nav>
        </div>
        <nav className="shop-category-nav" aria-label="Categorías de la tienda">
          {navigation.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}
        </nav>
      </header>
      <div id="catalogo"><ShopCatalog /></div>
    </div>
  );
}
