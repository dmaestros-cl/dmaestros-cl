"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  { image: "/images/hero/mobile-cajas-decorativas-v2.webp", alt: "Caja decorativa artesanal de madera", title: <>CAJAS<br/>DECORATIVAS</>, description: <>Diseñadas para momentos<br/>y objetos que valoras.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Cajas%20decorativas#catalogo", position: "center bottom" },
  { image: "/images/hero/mobile-cajas-entretencion-v2.webp", alt: "Caja de entretención artesanal de madera", title: <>CAJAS DE<br/>ENTRETENCIÓN</>, description: <>Diseñadas para compartir<br/>y guardar momentos.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo", position: "center bottom" },
  { image: "/images/hero/mobile-juguete-ludico-v2.webp", alt: "Juguetes lúdicos decorativos de madera", title: <>JUGUETE LÚDICO<br/>DECORATIVO</>, description: <>Diseños originales para el niño o niña<br/>que llevas dentro.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo", position: "center bottom" },
  { image: "/images/hero/mobile-muebles-v2.webp", alt: "Mueble artesanal de madera", title: <>MUEBLES</>, description: <>Diseños que aportan estilo<br/>y originalidad a tus espacios.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Muebles#catalogo", position: "center bottom" },
  { image: "/images/hero/mobile-comedores-v2.webp", alt: "Comedor fabricado en madera nativa", title: <>COMEDORES</>, description: <>Diseños modernos con personalidad,<br/>fabricados en maderas nativas.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Comedores#catalogo", position: "center bottom" },
  { image: "/images/hero/mobile-mascotas-v2.webp", alt: "Mueble de madera diseñado para mascotas", title: <>MASCOTAS</>, description: <>Estilo y elegancia<br/>también para ellas.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Mascotas#catalogo", position: "center bottom" },
  { image: "/images/hero/mobile-pedidos-especiales-v2.webp", alt: "Mueble especial fabricado a medida", title: <>PEDIDOS<br/>ESPECIALES</>, description: <>Tu mueble ideal<br/>lo hacemos realidad.</>, cta: "COTIZAR PROYECTO", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial", position: "center bottom" },
];

function HeroMark() {
  return (
    <svg className="carousel-mark-real" viewBox="0 0 415 328" aria-hidden="true">
      <image href="/images/logo-mark-transparent-v2.png" width="415" height="328" />
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
