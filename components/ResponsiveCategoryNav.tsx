"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type CategoryNavLink = {
  label: string;
  href: string;
};

export function ResponsiveCategoryNav({
  links,
  className,
  ariaLabel,
}: {
  links: CategoryNavLink[];
  className: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(links.length);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleItems = () => {
      const widths = itemRefs.current.map((item) => item?.getBoundingClientRect().width ?? 0);
      const available = container.clientWidth;
      const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
      const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);

      if (totalWidth <= available) {
        setVisibleCount(links.length);
        return;
      }

      const moreWidth = moreRef.current?.getBoundingClientRect().width ?? 54;
      let used = moreWidth + gap;
      let count = 0;

      for (const width of widths) {
        const nextWidth = used + width + (count ? gap : 0);
        if (nextWidth > available) break;
        used = nextWidth;
        count += 1;
      }

      setVisibleCount(Math.max(1, count));
    };

    updateVisibleItems();
    const observer = new ResizeObserver(updateVisibleItems);
    observer.observe(container);
    document.fonts?.ready.then(updateVisibleItems);
    return () => observer.disconnect();
  }, [links]);

  const overflowLinks = links.slice(visibleCount);

  return (
    <div ref={containerRef} className={`${className} responsive-category-nav`} role="navigation" aria-label={ariaLabel}>
      {links.slice(0, visibleCount).map(({ label, href }) => (
        <Link href={href} key={label}>{label}</Link>
      ))}
      {overflowLinks.length > 0 && (
        <details className="category-more">
          <summary>Más <span aria-hidden="true">⌄</span></summary>
          <div className="category-more-menu">
            {overflowLinks.map(({ label, href }) => (
              <Link href={href} key={label}>{label}</Link>
            ))}
          </div>
        </details>
      )}
      <div className="responsive-nav-measure" aria-hidden="true">
        {links.map(({ label }) => (
          <span key={label} ref={(element) => { itemRefs.current[links.findIndex((link) => link.label === label)] = element; }}>{label}</span>
        ))}
        <span ref={moreRef}>Más ⌄</span>
      </div>
    </div>
  );
}
