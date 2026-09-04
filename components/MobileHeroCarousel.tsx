"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  { image: "/images/hero/mobile-1.webp", title: <>CREAMOS<br/>PIEZAS QUE<br/>FORMAN PARTE<br/>DE TU VIDA</>, description: <>Muebles y juguetes en maderas nobles,<br/>hechos a mano con dedicación y pasión.</>, cta: "CONOCE NUESTRAS PIEZAS", href: "#productos" },
  { image: "/images/hero/mobile-2.webp", title: <>HISTORIAS DE<br/>MADERA PARA<br/>IMAGINAR SIN<br/>LÍMITES</>, description: <>Casas y figuras para convertir<br/>cada juego en una aventura.</>, cta: "DESCUBRE LOS JUGUETES", href: "#juguetes" },
  { image: "/images/hero/mobile-3.webp", title: <>JUGAR,<br/>DESCUBRIR Y<br/>CRECER DE FORMA<br/>NATURAL</>, description: <>Diseños resistentes para moverse,<br/>crear y jugar libremente.</>, cta: "VER JUEGOS DE MADERA", href: "#productos-juguetes" },
  { image: "/images/hero/mobile-4.webp", title: <>PEQUEÑOS<br/>ESPACIOS PARA<br/>GRANDES<br/>AVENTURAS</>, description: <>Cocinas y accesorios creados<br/>para aprender e imaginar.</>, cta: "EXPLORA LA COLECCIÓN", href: "#productos-juguetes" },
];

function HeroMark() {
  return (
    <svg className="carousel-mark-real" viewBox="0 0 415 328" aria-hidden="true">
      <filter id="transparent-logo-mobile" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 2.94" />
      </filter>
      <image href="/images/logo-dmaestros.png" width="1348" height="328" filter="url(#transparent-logo-mobile)" />
    </svg>
  );
}

export function MobileHeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const goTo = useCallback((index: number) => setActive((index + slides.length) % slides.length), []);
  const slide = slides[active];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 1500);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div className="mobile-hero-exact" aria-roledescription="carrusel" aria-label="Piezas destacadas" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mobile-carousel-stage">
        {slides.map((item, index) => <Image className={index === active ? "mobile-slide is-active" : "mobile-slide"} src={item.image} alt="Productos artesanales fabricados en madera" fill priority={index === 0} sizes="(max-width: 899px) 100vw, 0px" key={item.image} />)}
      </div>
      <div className="mobile-carousel-copy" key={slide.image}>
        <HeroMark />
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
        <a className="mobile-real-cta" href={slide.href}>{slide.cta} <span aria-hidden="true">→</span></a>
      </div>
      <button className="mobile-real-arrow mobile-real-prev" aria-label="Imagen anterior" onClick={() => goTo(active - 1)}>‹</button>
      <button className="mobile-real-arrow mobile-real-next" aria-label="Imagen siguiente" onClick={() => goTo(active + 1)}>›</button>
    </div>
  );
}
