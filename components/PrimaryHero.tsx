"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/hero-slides";

const categories = [
  { label: "Muebles", href: "/tienda?categoria=Muebles#catalogo", icon: "chair" },
  { label: "Juguetes", href: "/tienda?categoria=Juguete%20l%C3%BAdico%20decorativo#catalogo", icon: "horse" },
  { label: "Entretención", href: "/tienda?categoria=Cajas%20de%20entretenci%C3%B3n#catalogo", icon: "puzzle" },
  { label: "Decoración", href: "/tienda?categoria=Cajas%20decorativas#catalogo", icon: "vase" },
] as const;

function CategoryIcon({ icon }: { icon: (typeof categories)[number]["icon"] }) {
  const paths = {
    chair: <><path d="M7 11V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4"/><path d="M5 10a2 2 0 0 0-2 2v5h18v-5a2 2 0 0 0-2-2"/><path d="M6 17v3m12-3v3"/></>,
    horse: <><path d="M5 17c2 2 12 2 14-1"/><path d="M7 16V9l4-4 2 3 4 1-1 5-3 2"/><path d="M5 19h14"/></>,
    puzzle: <><path d="M9 3h6v4a2 2 0 1 0 4 0h2v6h-4a2 2 0 1 0 0 4h4v4h-6v-3a2 2 0 1 0-4 0v3H5v-6h3a2 2 0 1 0 0-4H5V7h4a2 2 0 1 0 0-4Z"/></>,
    vase: <><path d="M9 3h6m-5 0c0 4-3 5-3 10 0 5 2 8 5 8s5-3 5-8c0-5-3-6-3-10"/><path d="M7 13h10"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[icon]}</svg>;
}

export function PrimaryHero({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const slide = slides[active] ?? slides[0];
  const common = { alt: slide.alt, sizes: "100vw" };
  const { props: { srcSet: desktopSrcSet } } = getImageProps({ ...common, src: slide.desktopImage, width: 1672, height: 941, quality: 88 });
  const { props: { srcSet: mobileSrcSet, ...mobileImageProps } } = getImageProps({ ...common, src: slide.mobileImage, width: 896, height: 1754, quality: 88 });

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="primary-hero" aria-label="Presentación DMaestros">
      <picture className="primary-hero-picture" key={slide.mobileImage}>
        <source media="(min-width: 900px)" srcSet={desktopSrcSet} />
        <source media="(max-width: 899px)" srcSet={mobileSrcSet} />
        {/* getImageProps provides the optimized src/srcSet used for art direction. */}
        <img {...mobileImageProps} alt={slide.alt} className="primary-hero-image" fetchPriority="high" />
      </picture>

      <div className="primary-hero-copy">
        <Image className="primary-hero-mark" src="/images/logo-mark-transparent-v3.png" width={415} height={352} alt="" aria-hidden="true" />
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
        <Link className="primary-hero-cta" href={slide.href}>{slide.cta} <span aria-hidden="true">→</span></Link>
      </div>

      {slides.length > 1 && <>
        <button className="primary-hero-arrow is-prev" aria-label="Imagen anterior" onClick={() => setActive((active - 1 + slides.length) % slides.length)}>‹</button>
        <button className="primary-hero-arrow is-next" aria-label="Imagen siguiente" onClick={() => setActive((active + 1) % slides.length)}>›</button>
        <div className="primary-hero-dots" aria-label={`Diapositiva ${active + 1} de ${slides.length}`}>{slides.map((item, index) => <button className={index === active ? "is-active" : ""} aria-label={`Ver diapositiva ${index + 1}`} onClick={() => setActive(index)} key={item.mobileImage} />)}</div>
      </>}

      <nav className="primary-hero-categories" aria-label="Categorías destacadas">
        {categories.map((category) => (
          <Link href={category.href} key={category.label}>
            <span><CategoryIcon icon={category.icon} /></span>
            <b>{category.label}</b>
          </Link>
        ))}
      </nav>
    </section>
  );
}
