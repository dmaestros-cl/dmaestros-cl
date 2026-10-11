"use client";

import { ProductActions } from "@/components/ProductActions";
import { ProductCardMedia } from "@/components/ProductCardMedia";
import type { CatalogProduct } from "@/lib/catalog";
import { useEffect, useRef, useState } from "react";

function CategoryCarousel({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const carousel = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

  useEffect(() => {
    const element = carousel.current;
    if (!element) return;
    const update = () => {
      const previous = element.scrollLeft > 2;
      const next = element.scrollWidth - element.clientWidth - element.scrollLeft > 2;
      setEdges((current) => current.previous === previous && current.next === next ? current : { previous, next });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const card of element.children) observer.observe(card);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [count]);

  function move(direction: number) {
    const element = carousel.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return <div className="home-carousel-shell">
    <div ref={carousel} className="home-product-carousel" aria-label={`Productos de ${title}`}>{children}</div>
    {edges.previous && <button type="button" className="home-carousel-arrow is-prev" aria-label={`Ver productos anteriores de ${title}`} onClick={() => move(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>}
    {edges.next && <button type="button" className="home-carousel-arrow is-next" aria-label={`Ver más productos de ${title}`} onClick={() => move(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7" /></svg></button>}
  </div>;
}

const sectionDescriptions: Record<string, string> = {
  "Cajas decorativas": "Diseñadas para momentos y objetos que valoras.",
  "Cajas de entretención": "Diseñadas para compartir y guardar momentos.",
  "Cajas para corchos":
    "Conserva los recuerdos de cada celebración en una pieza hecha a mano.",
  "Cajas mixtas":
    "Colecciones versátiles para guardar corchos, tapas y buenos momentos.",
  "Cavas y bares":
    "Muebles únicos para disfrutar y exhibir tu colección con estilo.",
  "Juegos de cerveza": "Diseños originales para compartir, jugar y celebrar.",
  "Coffee Bar": "Estaciones de café funcionales, cálidas y hechas a tu medida.",
  "Juguete lúdico decorativo":
    "Diseños originales para el niño o niña que llevas dentro.",
  Muebles: "Diseños que aportan estilo y originalidad a tus espacios.",
  Comedores:
    "Modernos diseños con estilo y personalidad para tu hogar. Fabricados en maderas nativas.",
  Mascotas: "Porque nuestras mascotas también necesitan estilo y elegancia.",
};

export function HomeCategoryShowcase({
  products,
  whatsappNumber,
}: {
  products: CatalogProduct[];
  whatsappNumber: string;
}) {
  const categoryNames = [
    ...new Set(products.map((product) => product.category)),
  ].filter((category) => category !== "Sin categoría");
  const categorySections = categoryNames.map((title) => ({
    title,
    description:
      sectionDescriptions[title] ??
      "Piezas únicas elaboradas a mano para acompañar tus espacios y momentos.",
    products: products.filter((product) => product.category === title),
  }));

  return (
    <section className="home-showcase" aria-label="Colecciones DMaestros">
      {categorySections.map((category) => (
        <article className="category-showcase-section" key={category.title}>
          <header className="category-showcase-heading">
            <div>
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </div>
          </header>

          <CategoryCarousel title={category.title} count={category.products.length}>
            {category.products.map((product) => (
              <article
                className="home-product-card"
                key={`${category.title}-${product.sku}`}
              >
                <ProductCardMedia className="home-product-photo" href={`/productos/${encodeURIComponent(product.slug || product.sku)}`} image={product.image} name={product.name} videoUrl={product.youtubeUrl} available={product.available} price={product.price} salePrice={product.salePrice} sizes="(max-width: 899px) 50vw, 320px" />
                <p>{product.sku}</p>
                <h4>{product.name}</h4>
                <ProductActions
                  product={product}
                  whatsappNumber={whatsappNumber}
                  compact
                />
              </article>
            ))}
          </CategoryCarousel>
        </article>
      ))}
    </section>
  );
}
