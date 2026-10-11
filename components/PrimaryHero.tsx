"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/hero-slides";

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
        <Link className="primary-hero-cta" href={slide.href}>{slide.cta}</Link>
      </div>

      {slides.length > 1 && <>
        <button className="primary-hero-arrow is-prev" aria-label="Imagen anterior" onClick={() => setActive((active - 1 + slides.length) % slides.length)}>‹</button>
        <button className="primary-hero-arrow is-next" aria-label="Imagen siguiente" onClick={() => setActive((active + 1) % slides.length)}>›</button>
        <div className="primary-hero-dots" aria-label={`Diapositiva ${active + 1} de ${slides.length}`}>{slides.map((item, index) => <button className={index === active ? "is-active" : ""} aria-label={`Ver diapositiva ${index + 1}`} onClick={() => setActive(index)} key={item.mobileImage} />)}</div>
      </>}
    </section>
  );
}
