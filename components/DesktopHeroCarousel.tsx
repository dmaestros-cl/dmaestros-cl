"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { image: "/images/hero/dmaestros-banner.png", title: <>CREAMOS<br/>PIEZAS QUE<br/>FORMAN PARTE<br/>DE TU VIDA</>, description: <>Muebles y juguetes en maderas nobles,<br/>hechos a mano con dedicación y pasión.</>, cta: "CONOCE NUESTRAS PIEZAS", href: "#productos" },
  { image: "/images/hero/desktop-2.webp", title: <>HISTORIAS DE<br/>MADERA PARA<br/>IMAGINAR SIN<br/>LÍMITES</>, description: <>Casas y figuras que transforman cada juego<br/>en una aventura diferente.</>, cta: "DESCUBRE LOS JUGUETES", href: "#juguetes" },
  { image: "/images/hero/desktop-3.webp", title: <>JUGAR,<br/>DESCUBRIR Y<br/>CRECER DE FORMA<br/>NATURAL</>, description: <>Diseños resistentes que invitan al movimiento,<br/>la creatividad y el juego libre.</>, cta: "VER JUEGOS DE MADERA", href: "#productos-juguetes" },
  { image: "/images/hero/desktop-4.webp", title: <>PEQUEÑOS<br/>ESPACIOS PARA<br/>GRANDES<br/>AVENTURAS</>, description: <>Cocinas y accesorios de madera creados<br/>para aprender, compartir e imaginar.</>, cta: "EXPLORA LA COLECCIÓN", href: "#productos-juguetes" },
];

function HeroMark() {
  return (
    <svg className="carousel-mark-real" viewBox="0 0 415 328" aria-hidden="true">
      <filter id="transparent-logo-desktop" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 2.94" />
      </filter>
      <image href="/images/logo-dmaestros.png" width="1348" height="328" filter="url(#transparent-logo-desktop)" />
    </svg>
  );
}

export function DesktopHeroCarousel() {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const go = (step: number) => setActive((current) => (current + step + slides.length) % slides.length);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="desktop-carousel" aria-roledescription="carrusel" aria-label="Colecciones destacadas">
      {slides.map((item, index) => <Image className={index === active ? "desktop-slide is-active" : "desktop-slide"} src={item.image} alt="Productos artesanales fabricados en madera" fill priority={index === 0} sizes="(min-width: 900px) 100vw, 0px" key={item.image} />)}
      <div className={active === 0 ? "desktop-carousel-copy dmaestros-banner-copy" : "desktop-carousel-copy"} key={slide.image}>
        <HeroMark />
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
        <a className="cta" href={slide.href}>{slide.cta} <span aria-hidden="true">→</span></a>
      </div>
      <button className="slider-arrow previous" aria-label="Imagen anterior" onClick={() => go(-1)}>‹</button>
      <button className="slider-arrow next" aria-label="Imagen siguiente" onClick={() => go(1)}>›</button>
    </div>
  );
}
