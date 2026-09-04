"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { image: "/images/hero/cajas-decorativas.webp", alt: "Caja decorativa artesanal de madera", title: <>CAJAS<br/>DECORATIVAS</>, description: <>Diseñadas para momentos y objetos<br/>que valoras.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Cajas%20decorativas#catalogo", position: "42% bottom" },
  { image: "/images/hero/cajas-entretencion.webp", alt: "Caja de entretención artesanal de madera", title: <>CAJAS DE<br/>ENTRETENCIÓN</>, description: <>Diseñadas para compartir<br/>y guardar momentos.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo", position: "55% bottom" },
  { image: "/images/hero/juguete-ludico.webp", alt: "Juguetes lúdicos decorativos de madera", title: <>JUGUETE LÚDICO<br/>DECORATIVO</>, description: <>Diseños originales para el niño o niña<br/>que llevas dentro.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo", position: "45% bottom" },
  { image: "/images/editorial/furniture.webp", alt: "Mueble artesanal de madera", title: <>MUEBLES</>, description: <>Diseños que aportan estilo<br/>y originalidad a tus espacios.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Muebles#catalogo", position: "65% bottom" },
  { image: "/images/hero/comedor-artesanal.webp", alt: "Comedor fabricado en madera nativa", title: <>COMEDORES</>, description: <>Diseños modernos con estilo y personalidad,<br/>fabricados en maderas nativas.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Comedores#catalogo", position: "70% bottom" },
  { image: "/images/hero/mascotas-artesanal.webp", alt: "Mueble de madera diseñado para mascotas", title: <>MASCOTAS</>, description: <>Porque nuestras mascotas también necesitan<br/>estilo y elegancia.</>, cta: "VER CATEGORÍA", href: "/tienda?categoria=Mascotas#catalogo", position: "70% bottom" },
  { image: "/images/hero/pedidos-especiales.webp", alt: "Mueble especial fabricado a medida", title: <>PEDIDOS<br/>ESPECIALES</>, description: <>Tu mueble ideal<br/>lo hacemos realidad.</>, cta: "COTIZAR PROYECTO", href: "mailto:contacto@dmaestros.cl?subject=Pedido%20especial", position: "55% bottom" },
];

function HeroMark() {
  return (
    <svg className="carousel-mark-real" viewBox="0 0 415 328" aria-hidden="true">
      <image href="/images/logo-mark-transparent-v2.png" width="415" height="328" />
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
      {slides.map((item, index) => <Image className={index === active ? "desktop-slide is-active" : "desktop-slide"} src={item.image} alt={item.alt} fill priority={index === 0} sizes="(min-width: 900px) 100vw, 0px" style={{ objectPosition: item.position }} key={item.image} />)}
      <div className="desktop-carousel-copy" key={slide.image}>
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
