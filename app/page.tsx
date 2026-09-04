import Image from "next/image";
import { MobileHeroCarousel } from "@/components/MobileHeroCarousel";
import { DesktopHeroCarousel } from "@/components/DesktopHeroCarousel";
import { SiteHeader } from "@/components/SiteHeader";

const categoryBanners = [
  { title: "Cajas decorativas", description: "Diseñadas para momentos y objetos que valoras.", image: "/images/banners/cajas-decorativas-premium.png", mobileImage: "/images/hero/mobile-cajas-decorativas-v3.webp", href: "/tienda?categoria=Cajas%20decorativas#catalogo" },
  { title: "Cajas de entretención", description: "Diseñadas para compartir y guardar momentos.", image: "/images/banners/cajas-entretencion-premium.png", mobileImage: "/images/hero/mobile-cajas-entretencion-v3.webp", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo" },
  { title: "Juguete lúdico decorativo", description: "Diseños originales para el niño o niña que llevas dentro.", image: "/images/hero/juguete-ludico-banner.png", mobileImage: "/images/hero/mobile-juguete-ludico-v3.webp", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo" },
  { title: "Muebles", description: "Diseños que aportan estilo y originalidad a tus espacios.", image: "/images/editorial/furniture.webp", mobileImage: "/images/hero/mobile-muebles-v3.webp", href: "/tienda?categoria=Muebles#catalogo" },
  { title: "Comedores", description: "Modernos diseños con estilo y personalidad para tu hogar. Fabricados en maderas nativas.", image: "/images/hero/comedor-artesanal.png", mobileImage: "/images/hero/mobile-comedores-v3.webp", href: "/tienda?categoria=Comedores#catalogo" },
  { title: "Mascotas", description: "Porque nuestras mascotas también necesitan estilo y elegancia.", image: "/images/hero/mascotas-artesanal.png", mobileImage: "/images/hero/mobile-mascotas-v3.webp", href: "/tienda?categoria=Mascotas#catalogo" },
  { title: "Pedidos especiales", description: "Tu mueble ideal lo hacemos realidad.", image: "/images/banners/pedidos-especiales-premium.png", mobileImage: "/images/hero/mobile-pedidos-especiales-v3.webp", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial" },
];

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="inicio" className="hero">
        <MobileHeroCarousel />
        <Image className="hero-image hero-mobile" src="/images/hero-workshop.png" alt="Mueble de madera con juguetes artesanales y un florero" fill priority sizes="(max-width: 899px) 100vw, 0px" />
        <DesktopHeroCarousel />
      </main>
      <section className="category-banners" aria-label="Colecciones DMaestros">
        {categoryBanners.map((banner) => (
          <a className="category-banner" href={banner.href} key={banner.title} target={banner.href.startsWith("https://") ? "_blank" : undefined} rel={banner.href.startsWith("https://") ? "noopener noreferrer" : undefined}>
            <span className="category-banner-image">
              <picture>
                <source media="(max-width: 899px)" srcSet={banner.mobileImage} />
                <Image src={banner.image} alt={banner.title} fill sizes="58vw" />
              </picture>
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
