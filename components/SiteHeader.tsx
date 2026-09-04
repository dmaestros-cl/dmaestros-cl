"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { MobileMenu } from "@/components/MobileMenu";
import { ProductSearch } from "@/components/ProductSearch";
import { ResponsiveCategoryNav, type CategoryNavLink } from "@/components/ResponsiveCategoryNav";

function HeaderIcon({ name }: { name: "location" | "user" | "cart" }) {
  const paths = {
    location: <><path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 22c.5-6 3-9 8-9s7.5 3 8 9"/></>,
    cart: <><path d="M2 3h3l2.3 12.5h10.8L21 7H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

const navigation: CategoryNavLink[] = [
  { label: "TIENDA", href: "/tienda" },
  { label: "MUEBLES", href: "/tienda?categoria=Muebles#catalogo" },
  { label: "COMEDORES", href: "/tienda?categoria=Comedores#catalogo" },
  { label: "CAVAS Y BARES", href: "/tienda?categoria=Cavas%20y%20bares#catalogo" },
  { label: "CAJAS PARA CORCHOS", href: "/tienda?categoria=Cajas%20para%20corchos#catalogo" },
  { label: "CAJAS MIXTAS", href: "/tienda?categoria=Cajas%20mixtas#catalogo" },
  { label: "CAJAS DECORATIVAS", href: "/tienda?categoria=Cajas%20decorativas#catalogo" },
  { label: "CAJAS DE ENTRETENCIÓN", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo" },
  { label: "JUEGOS DE CERVEZA", href: "/tienda?categoria=Juegos%20de%20cerveza#catalogo" },
  { label: "JUGUETE LÚDICO DECORATIVO", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo" },
  { label: "COFFEE BAR", href: "/tienda?categoria=Coffee%20Bar#catalogo" },
  { label: "MASCOTAS", href: "/tienda?categoria=Mascotas#catalogo" },
  { label: "PEDIDOS ESPECIALES", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial" },
];

function BrandLogo({ filterId }: { filterId: string }) {
  return (
    <svg className="brand-white-logo" viewBox="0 0 1348 328" role="img" aria-label="DMaestros">
      <filter id={filterId} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1 -1 -1 0 2.94" />
      </filter>
      <image href="/images/logo-dmaestros.png" width="1348" height="328" filter={`url(#${filterId})`} />
    </svg>
  );
}

export function SiteHeader() {
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <div className="mobile-header-reference">
        <Link className="mobile-real-logo" href="/" aria-label="DMaestros, inicio"><BrandLogo filterId="shared-white-logo-mobile" /></Link>
        <ProductSearch mobile />
        <Link className="mobile-header-action" href="/tienda" aria-label="Mi cuenta"><HeaderIcon name="user" /></Link>
        <Link className="mobile-header-action cart-header-action" href="/tienda" aria-label={`Carro, ${itemCount} producto${itemCount === 1 ? "" : "s"}`}><HeaderIcon name="cart" />{itemCount > 0 && <span className="cart-count">{itemCount}</span>}</Link>
      </div>
      <div className="topbar">
        <Link className="brand" href="/" aria-label="DMaestros, inicio"><BrandLogo filterId="shared-white-logo" /></Link>
        <span className="brand-divider" aria-hidden="true" />
        <span className="brand-store">store</span>
        <ProductSearch />
        <nav className="header-actions" aria-label="Accesos rápidos">
          <Link className="header-action location-action" href="/tienda"><HeaderIcon name="location" /><span>Tienda</span></Link>
          <Link className="header-action" href="/tienda"><HeaderIcon name="user" /><span>Mi Cuenta</span></Link>
          <Link className="header-action cart-header-action" href="/tienda" aria-label={`Carro, ${itemCount} producto${itemCount === 1 ? "" : "s"}`}><HeaderIcon name="cart" /><span>Carro</span>{itemCount > 0 && <b className="cart-count">{itemCount}</b>}</Link>
        </nav>
      </div>
      <div className="mobile-menu-reference"><MobileMenu /></div>
      <nav className="navline" aria-label="Navegación principal">
        <ResponsiveCategoryNav links={navigation} className="desktop-links" ariaLabel="Categorías" />
      </nav>
    </header>
  );
}
