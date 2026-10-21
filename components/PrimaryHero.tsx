"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/hero-slides";
import ktaruLogo from "@/public/images/logo-ktaru-transparent.png";

export function PrimaryHero({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const slide = slides[active] ?? slides[0];
  const common = { alt: slide.alt, sizes: "100vw", loading: "eager" as const };
  const desktopSize = slide.desktopSize ?? { width: 1672, height: 941 };
  const mobileSize = slide.mobileSize ?? { width: 896, height: 1754 };
  const { props: { srcSet: desktopSrcSet } } = getImageProps({ ...common, src: slide.desktopImage, ...desktopSize, quality: 88 });
  const { props: { srcSet: mobileSrcSet, ...mobileImageProps } } = getImageProps({ ...common, src: slide.mobileImage, ...mobileSize, quality: 88 });
  const title = slide.title.trim();
  const description = slide.description.trim();
  const cta = slide.cta.trim();
  const hasButton = Boolean(cta && slide.href.trim());
  const hasCopy = Boolean(title || description || hasButton);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="primary-hero" aria-label="Presentación DMaestros">
      <picture className="primary-hero-picture" key={`${slide.mobileImage}-${slide.desktopImage}`}>
        <source media="(min-width: 900px)" srcSet={desktopSrcSet} width={desktopSize.width} height={desktopSize.height} />
        <source media="(max-width: 899px)" srcSet={mobileSrcSet} width={mobileSize.width} height={mobileSize.height} />
        {/* getImageProps provides the optimized src/srcSet used for art direction. */}
        <img {...mobileImageProps} alt={slide.alt} className="primary-hero-image" fetchPriority="high" />
      </picture>

      {hasCopy && <div className="primary-hero-copy">
        <div className="primary-hero-brands">
          <span className="primary-hero-brand is-dm">
            <Image className="primary-hero-mark" src="/images/logo-mark-transparent-v3.png" width={354} height={300} sizes="90px" alt="DMaestros" />
          </span>
          <span className="primary-hero-brand-divider" aria-hidden="true" />
          <span className="primary-hero-brand is-ktaru">
            <Image className="primary-hero-mark" src={ktaruLogo} sizes="160px" alt="Ktaru — Madera, diseño e imaginación" />
          </span>
        </div>
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
        {hasButton && <Link className="primary-hero-cta" href={slide.href}>{cta}</Link>}
      </div>}

      {slides.length > 1 && <>
        <button className="primary-hero-arrow is-prev" aria-label="Imagen anterior" onClick={() => setActive((active - 1 + slides.length) % slides.length)}>‹</button>
        <button className="primary-hero-arrow is-next" aria-label="Imagen siguiente" onClick={() => setActive((active + 1) % slides.length)}>›</button>
        <div className="primary-hero-dots" aria-label={`Diapositiva ${active + 1} de ${slides.length}`}>{slides.map((item, index) => <button className={index === active ? "is-active" : ""} aria-label={`Ver diapositiva ${index + 1}`} onClick={() => setActive(index)} key={item.mobileImage} />)}</div>
      </>}
    </section>
  );
}
