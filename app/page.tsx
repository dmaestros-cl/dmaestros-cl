import Image from "next/image";
import { MobileHeroCarousel } from "@/components/MobileHeroCarousel";
import { DesktopHeroCarousel } from "@/components/DesktopHeroCarousel";
import { MobileMenu } from "@/components/MobileMenu";
import { ProductSearch } from "@/components/ProductSearch";

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
  { label: "CAVAS Y BARES", href: "/tienda?categoria=Cavas%20y%20bares#catalogo" },
  { label: "CAJAS PARA CORCHOS", href: "/tienda?categoria=Cajas%20para%20corchos#catalogo" },
  { label: "CAJAS MIXTAS", href: "/tienda?categoria=Cajas%20mixtas#catalogo" },
  { label: "JUEGOS DE CERVEZA", href: "/tienda?categoria=Juegos%20de%20cerveza#catalogo" },
  { label: "COFFEE BAR", href: "/tienda?categoria=Coffee%20Bar#catalogo" },
  { label: "PEDIDOS ESPECIALES", href: "#whatsapp" },
];

const featuredCollections = [
  { label: "Muebles para el hogar", href: "#productos", image: "/images/products/rack-aparador-listonado.png" },
  { label: "Cavas y bares", href: "#productos", image: "/images/products/cava-ovalada.png" },
  { label: "Cajas para corchos", href: "#productos-bar", image: "/images/products/caja-corchos-momentos.png" },
  { label: "Juegos de cerveza", href: "#productos-bar", image: "/images/products/juego-cerveza-nogal.png" },
  { label: "Coffee Bar", href: "#productos-bar", image: "/images/products/coffee-bar-iluminado.png" },
];

const products = [
  { sku: "DM-M01", name: "Cava bar ovalada de madera", image: "/images/products/cava-ovalada.png" },
  { sku: "DM-M02", name: "Mueble TV mural listonado", image: "/images/products/mueble-tv-mural.png" },
  { sku: "DM-M03", name: "Rack aparador listonado con cajones", image: "/images/products/rack-aparador-listonado.png" },
  { sku: "DM-M04", name: "Centro de entretenimiento modular", image: "/images/products/centro-entretenimiento.png" },
  { sku: "DM-M05", name: "Buffet listonado de madera", image: "/images/products/buffet-listonado.png" },
  { sku: "DM-M06", name: "Buffet clásico de cuatro puertas", image: "/images/products/buffet-cuatro-puertas.png" },
];

const barProducts = [
  { sku: "DM-C01", name: "Caja para corchos · El vino mejora con la edad", image: "/images/products/caja-vino-mejora-edad.png" },
  { sku: "DM-C02", name: "Caja para corchos · El mejor vino se comparte", image: "/images/products/caja-mejor-vino-compania.png" },
  { sku: "DM-C03", name: "Caja para corchos · Ven, yo invito al vino", image: "/images/products/caja-yo-invito-vino.png" },
  { sku: "DM-C04", name: "Caja para corchos · Momentos inolvidables", image: "/images/products/caja-corchos-momentos.png" },
  { sku: "DM-C05", name: "Caja para corchos · Testigo de buenos momentos", image: "/images/products/caja-corchos-testigo.png" },
  { sku: "DM-C06", name: "Caja mixta para tapas y corchos · Salucita", image: "/images/products/caja-mixta-salucita.png" },
  { sku: "DM-C07", name: "Caja coleccionadora para cerveza y vino", image: "/images/products/caja-cerveza-vino.png" },
  { sku: "DM-J01", name: "Juego destapador de cerveza · Nogal", image: "/images/products/juego-cerveza-nogal-vertical.png" },
  { sku: "DM-J02", name: "Juego destapador de cerveza · Natural", image: "/images/products/juego-cerveza-natural-vertical.png" },
  { sku: "DM-J03", name: "El juego de la cerveza · Nogal", image: "/images/products/juego-cerveza-nogal.png" },
  { sku: "DM-J04", name: "El juego de la cerveza · Natural", image: "/images/products/juego-cerveza-natural.png" },
  { sku: "DM-B01", name: "Mueble Coffee Bar iluminado", image: "/images/products/coffee-bar-iluminado.png" },
  { sku: "DM-B02", name: "Estación de café DMaestros", image: "/images/products/estacion-cafe.png" },
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
          <a className="mobile-header-action" href="#whatsapp" aria-label="Mi cuenta"><Icon name="user" /></a>
          <a className="mobile-header-action" href="#productos" aria-label="Carro"><Icon name="cart" /></a>
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
            <a className="header-action location-action" href="#productos"><Icon name="location" /><span>Tiendas</span></a>
            <a className="header-action" href="#whatsapp"><Icon name="user" /><span>Mi Cuenta</span></a>
            <a className="header-action" href="#productos"><Icon name="cart" /><span>Carro</span></a>
          </nav>
        </div>
        <div className="mobile-menu-reference">
          <MobileMenu />
        </div>
        <nav className="navline" aria-label="Navegación principal">
          <span className="mobile-menu-label">MENU</span>
          <div className="desktop-links">
            {headerCategories.map(({ label, href }) => <a href={href} key={label}>{label}</a>)}
          </div>
          <button type="button" aria-label="Abrir menú"><Icon name="menu" /></button>
        </nav>
      </header>
      <main id="inicio" className="hero">
        <MobileHeroCarousel />
        <Image className="hero-image hero-mobile" src="/images/hero-workshop.png" alt="Mueble de madera con juguetes artesanales y un florero" fill priority sizes="(max-width: 899px) 100vw, 0px" />
        <DesktopHeroCarousel />
      </main>
      <section className="wood-collection" id="muebles">
        <div className="collection-heading catalog-heading">
          <span className="collection-kicker">HECHO A MANO EN CHILE</span>
          <h2>Colecciones en madera DMaestros</h2>
          <p>Objetos originales, funcionales y entretenidos, fabricados con dedicación para darle a tu hogar un sello personal. Descubre piezas de madera para decorar, regalar y conservar tus mejores recuerdos.</p>
        </div>

        <div className="featured-collections" aria-label="Colecciones destacadas">
          {featuredCollections.map((collection) => (
            <a className="featured-collection-card" href={collection.href} key={collection.label}>
              <Image src={collection.image} alt={collection.label} fill sizes="(max-width: 899px) 72vw, 240px" />
              <strong>{collection.label}</strong>
            </a>
          ))}
        </div>

        <div className="product-grid" id="productos">
          {products.map((product) => (
            <article className="product-card" data-product-name={product.name} id={product.sku.toLowerCase()} key={product.sku}>
              <a className="product-photo" href="#whatsapp">
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 899px) 50vw, 300px" />
              </a>
              <p className="product-meta">SKU: {product.sku} <span>DISPONIBLE</span></p>
              <h3>{product.name}</h3>
              <a className="product-price" href={`https://wa.me/?text=${encodeURIComponent(`Hola DMaestros, quiero consultar por ${product.name} (${product.sku}).`)}`} target="_blank" rel="noopener noreferrer">Consultar precio →</a>
            </article>
          ))}
        </div>
      </section>
      <section className="wood-collection secondary-collection" id="juguetes">
        <div className="collection-heading">
          <span className="collection-kicker">BAR, VINO Y BUENOS MOMENTOS</span>
          <h2>Productos para disfrutar y compartir</h2>
          <p>Cajas coleccionadoras, juegos con destapador y estaciones de café fabricadas en madera. Diseños originales que convierten cada encuentro en un recuerdo especial.</p>
        </div>

        <div className="editorial-grid">
          <a className="editorial-card" href="#productos-bar">
            <Image src="/images/products/caja-mixta-salucita.png" alt="Cajas coleccionadoras para tapas y corchos" fill sizes="(max-width: 899px) 50vw, 600px" />
            <span>Cajas coleccionadoras</span>
          </a>
          <a className="editorial-card" href="#productos-bar">
            <Image src="/images/products/coffee-bar-iluminado.png" alt="Mueble Coffee Bar de madera" fill sizes="(max-width: 899px) 50vw, 600px" />
            <span>Tu rincón favorito</span>
          </a>
        </div>

        <div className="product-grid" id="productos-bar">
          {barProducts.map((product) => (
            <article className="product-card" data-product-name={product.name} id={product.sku.toLowerCase()} key={product.sku}>
              <a className="product-photo" href="#whatsapp">
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 899px) 50vw, 300px" />
              </a>
              <p className="product-meta">SKU: {product.sku} <span>DISPONIBLE</span></p>
              <h3>{product.name}</h3>
              <a className="product-price" href={`https://wa.me/?text=${encodeURIComponent(`Hola DMaestros, quiero consultar por ${product.name}.`)}`} target="_blank" rel="noopener noreferrer">Consultar precio →</a>
            </article>
          ))}
        </div>
      </section>
      <a className="whatsapp-float" id="whatsapp" href="https://wa.me/?text=Hola%20DMaestros%2C%20quiero%20hacer%20una%20consulta." target="_blank" rel="noopener noreferrer" aria-label="WhatsApp disponible: iniciar conversación">
        <span className="whatsapp-label">Vendedor en Línea</span>
        <span className="whatsapp-status" aria-hidden="true" />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
