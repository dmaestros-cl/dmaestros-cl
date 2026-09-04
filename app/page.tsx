import Image from "next/image";
import { MobileHeroCarousel } from "@/components/MobileHeroCarousel";
import { DesktopHeroCarousel } from "@/components/DesktopHeroCarousel";
import { MobileMenu } from "@/components/MobileMenu";
import { ProductSearch } from "@/components/ProductSearch";
import { ResponsiveCategoryNav } from "@/components/ResponsiveCategoryNav";

function Icon({ name }: { name: "search" | "location" | "user" | "cart" | "menu" | "arrow" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
    location: <><path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 22c.5-6 3-9 8-9s7.5 3 8 9"/></>,
    cart: <><path d="M2 3h3l2.3 12.5h10.8L21 7H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
    arrow: <path d="M5 12h14M14 7l5 5-5 5"/>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

const headerCategories = [
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

const categoryBanners = [
  { title: "Cajas decorativas", description: "Diseñadas para momentos y objetos que valoras.", image: "/images/banners/cajas-decorativas-premium.png", href: "/tienda?categoria=Cajas%20decorativas#catalogo" },
  { title: "Cajas de entretención", description: "Diseñadas para compartir y guardar momentos.", image: "/images/banners/cajas-entretencion-premium.png", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo" },
  { title: "Juguete lúdico decorativo", description: "Diseños originales para el niño o niña que llevas dentro.", image: "/images/hero/juguete-ludico-banner.png", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo" },
  { title: "Muebles", description: "Diseños que aportan estilo y originalidad a tus espacios.", image: "/images/editorial/furniture.webp", href: "/tienda?categoria=Muebles#catalogo" },
  { title: "Comedores", description: "Modernos diseños con estilo y personalidad para tu hogar. Fabricados en maderas nativas.", image: "/images/hero/comedor-artesanal.png", href: "/tienda?categoria=Comedores#catalogo" },
  { title: "Mascotas", description: "Porque nuestras mascotas también necesitan estilo y elegancia.", image: "/images/hero/mascotas-artesanal.png", href: "/tienda?categoria=Mascotas#catalogo" },
  { title: "Pedidos especiales", description: "Tu mueble ideal lo hacemos realidad.", image: "/images/banners/pedidos-especiales-premium.png", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial" },
];

export default function Home() {
  return (
    <div className="site-shell">
      <header>
        <div className="mobile-header-reference">
          <a className="mobile-real-logo" href="#inicio" aria-label="DMaestros, inicio">
            <svg viewBox="0 0 1348 328" role="img" aria-label="DMaestros">
              <filter id="white-logo-mobile-header" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1 -1 -1 0 2.94" />
              </filter>
              <image href="/images/logo-dmaestros.png" width="1348" height="328" filter="url(#white-logo-mobile-header)" />
            </svg>
          </a>
          <ProductSearch mobile />
          <a className="mobile-header-action" href="/tienda" aria-label="Mi cuenta"><Icon name="user" /></a>
          <a className="mobile-header-action" href="/tienda" aria-label="Carro"><Icon name="cart" /></a>
        </div>
        <div className="topbar">
          <a className="brand" href="#inicio" aria-label="DMaestros, inicio">
            <svg className="brand-white-logo" viewBox="0 0 1348 328" role="img" aria-label="DMaestros">
              <filter id="white-logo" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 1
                          0 0 0 0 1
                          0 0 0 0 1
                         -1 -1 -1 0 2.94"
                />
              </filter>
              <image href="/images/logo-dmaestros.png" width="1348" height="328" filter="url(#white-logo)" />
            </svg>
          </a>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-store">store</span>
          <ProductSearch />
          <nav className="header-actions" aria-label="Accesos rápidos">
            <a className="header-action location-action" href="/tienda"><Icon name="location" /><span>Tienda</span></a>
            <a className="header-action" href="/tienda"><Icon name="user" /><span>Mi Cuenta</span></a>
            <a className="header-action" href="/tienda"><Icon name="cart" /><span>Carro</span></a>
          </nav>
        </div>
        <div className="mobile-menu-reference">
          <MobileMenu />
        </div>
        <nav className="navline" aria-label="Navegación principal">
          <span className="mobile-menu-label">MENU</span>
          <ResponsiveCategoryNav links={headerCategories} className="desktop-links" ariaLabel="Categorías" />
          <button type="button" aria-label="Abrir menú"><Icon name="menu" /></button>
        </nav>
      </header>
      <main id="inicio" className="hero">
        <MobileHeroCarousel />
        <Image className="hero-image hero-mobile" src="/images/hero-workshop.png" alt="Mueble de madera con juguetes artesanales y un florero" fill priority sizes="(max-width: 899px) 100vw, 0px" />
        <DesktopHeroCarousel />
      </main>
      <section className="category-banners" aria-label="Colecciones DMaestros">
        {categoryBanners.map((banner) => (
          <a className="category-banner" href={banner.href} key={banner.title} target={banner.href.startsWith("https://") ? "_blank" : undefined} rel={banner.href.startsWith("https://") ? "noopener noreferrer" : undefined}>
            <span className="category-banner-image">
              <Image src={banner.image} alt={banner.title} fill sizes="(max-width: 899px) 100vw, 58vw" />
            </span>
            <span className="category-banner-copy">
              <strong>{banner.title}</strong>
              <span>{banner.description}</span>
              <b>Ver categoría <i aria-hidden="true">→</i></b>
            </span>
          </a>
        ))}
      </section>
    </div>
  );
}
