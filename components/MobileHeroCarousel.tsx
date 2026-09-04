"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  { image: "/images/hero/cajas-decorativas.webp", alt: "Caja decorativa artesanal de madera", title: <>CAJAS<br/>DECORATIVAS</>, description: <>Diseñadas para momentos<br/>y objetos que valoras.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Cajas%20decorativas#catalogo", position: "38% bottom" },
  { image: "/images/hero/cajas-entretencion.webp", alt: "Caja de entretención artesanal de madera", title: <>CAJAS DE<br/>ENTRETENCIÓN</>, description: <>Diseñadas para compartir<br/>y guardar momentos.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo", position: "55% bottom" },
  { image: "/images/hero/juguete-ludico-mobile.webp", alt: "Juguetes lúdicos decorativos de madera", title: <>JUGUETE LÚDICO<br/>DECORATIVO</>, description: <>Diseños originales para el niño o niña<br/>que llevas dentro.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo", position: "center bottom" },
  { image: "/images/editorial/furniture.webp", alt: "Mueble artesanal de madera", title: <>MUEBLES</>, description: <>Diseños que aportan estilo<br/>y originalidad a tus espacios.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Muebles#catalogo", position: "70% bottom" },
  { image: "/images/hero/comedor-artesanal.webp", alt: "Comedor fabricado en madera nativa", title: <>COMEDORES</>, description: <>Diseños modernos con personalidad,<br/>fabricados en maderas nativas.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Comedores#catalogo", position: "73% bottom" },
  { image: "/images/hero/mascotas-artesanal.webp", alt: "Mueble de madera diseñado para mascotas", title: <>MASCOTAS</>, description: <>Estilo y elegancia<br/>también para ellas.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Mascotas#catalogo", position: "70% bottom" },
  { image: "/images/hero/pedidos-especiales.webp", alt: "Mueble especial fabricado a medida", title: <>PEDIDOS<br/>ESPECIALES</>, description: <>Tu mueble ideal<br/>lo hacemos realidad.</>, cta: "COTIZAR PROYECTO", href: "https://wa.me/?text=Hola%20DMaestros%2C%20quiero%20cotizar%20un%20pedido%20especial.", position: "58% bottom" },
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
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div className="mobile-hero-exact" aria-roledescription="carrusel" aria-label="Piezas destacadas" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mobile-carousel-stage">
        {slides.map((item, index) => <Image className={index === active ? "mobile-slide is-active" : "mobile-slide"} src={item.image} alt={item.alt} fill priority={index === 0} sizes="(max-width: 899px) 100vw, 0px" style={{ objectPosition: item.position }} key={item.image} />)}
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
