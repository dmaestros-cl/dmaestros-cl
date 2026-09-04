"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const products = [
  { sku: "DM-M01", name: "Cava bar ovalada de madera", image: "/images/products/cava-ovalada.png", category: "Cavas y bares" },
  { sku: "DM-M02", name: "Mueble TV mural listonado", image: "/images/products/mueble-tv-mural.png", category: "Muebles" },
  { sku: "DM-M03", name: "Rack aparador listonado con cajones", image: "/images/products/rack-aparador-listonado.png", category: "Muebles" },
  { sku: "DM-M04", name: "Centro de entretenimiento modular", image: "/images/products/centro-entretenimiento.png", category: "Muebles" },
  { sku: "DM-M05", name: "Buffet listonado de madera", image: "/images/products/buffet-listonado.png", category: "Muebles" },
  { sku: "DM-M06", name: "Buffet clásico de cuatro puertas", image: "/images/products/buffet-cuatro-puertas.png", category: "Muebles" },
  { sku: "DM-C01", name: "Caja para corchos · El vino mejora con la edad", image: "/images/products/caja-vino-mejora-edad.png", category: "Cajas para corchos" },
  { sku: "DM-C02", name: "Caja para corchos · El mejor vino se comparte", image: "/images/products/caja-mejor-vino-compania.png", category: "Cajas para corchos" },
  { sku: "DM-C03", name: "Caja para corchos · Ven, yo invito al vino", image: "/images/products/caja-yo-invito-vino.png", category: "Cajas para corchos" },
  { sku: "DM-C04", name: "Caja para corchos · Momentos inolvidables", image: "/images/products/caja-corchos-momentos.png", category: "Cajas para corchos" },
  { sku: "DM-C05", name: "Caja para corchos · Testigo de buenos momentos", image: "/images/products/caja-corchos-testigo.png", category: "Cajas para corchos" },
  { sku: "DM-C06", name: "Caja mixta para tapas y corchos · Salucita", image: "/images/products/caja-mixta-salucita.png", category: "Cajas mixtas" },
  { sku: "DM-C07", name: "Caja coleccionadora para cerveza y vino", image: "/images/products/caja-cerveza-vino.png", category: "Cajas mixtas" },
  { sku: "DM-J01", name: "Juego destapador de cerveza · Nogal", image: "/images/products/juego-cerveza-nogal-vertical.png", category: "Juegos de cerveza" },
  { sku: "DM-J02", name: "Juego destapador de cerveza · Natural", image: "/images/products/juego-cerveza-natural-vertical.png", category: "Juegos de cerveza" },
  { sku: "DM-J03", name: "El juego de la cerveza · Nogal", image: "/images/products/juego-cerveza-nogal.png", category: "Juegos de cerveza" },
  { sku: "DM-J04", name: "El juego de la cerveza · Natural", image: "/images/products/juego-cerveza-natural.png", category: "Juegos de cerveza" },
  { sku: "DM-B01", name: "Mueble Coffee Bar iluminado", image: "/images/products/coffee-bar-iluminado.png", category: "Coffee Bar" },
  { sku: "DM-B02", name: "Estación de café DMaestros", image: "/images/products/estacion-cafe.png", category: "Coffee Bar" },
];

const categories = ["Muebles", "Cavas y bares", "Cajas para corchos", "Cajas mixtas", "Juegos de cerveza", "Coffee Bar"];

export function ShopCatalog({ initialCategory }: { initialCategory?: string }) {
  const validInitialCategory = initialCategory && categories.includes(initialCategory) ? initialCategory : undefined;
  const [selected, setSelected] = useState<string[]>(validInitialCategory ? [validInitialCategory] : []);
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSelected(validInitialCategory ? [validInitialCategory] : []);
  }, [validInitialCategory]);

  const visible = useMemo(() => {
    const filtered = products.filter((product) =>
      (!selected.length || selected.includes(product.category)) &&
      product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")),
    );
    if (sort === "az") return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (sort === "za") return [...filtered].sort((a, b) => b.name.localeCompare(a.name, "es"));
    return filtered;
  }, [selected, sort, query]);

  function toggleCategory(category: string) {
    setSelected((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  return (
    <main className="shop-page">
      <div className="shop-layout">
        <aside className="shop-filters">
          <h2>Filtrar por</h2>
          <div className="filter-group">
            <h3>Categorías</h3>
            {categories.map((category) => (
              <label key={category}>
                <input type="checkbox" checked={selected.includes(category)} onChange={() => toggleCategory(category)} />
                <span>{category}</span>
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>Terminación</h3>
            <label><input type="checkbox" /><span>Madera natural</span></label>
            <label><input type="checkbox" /><span>Tono nogal</span></label>
            <label><input type="checkbox" /><span>Combinado</span></label>
          </div>
          {selected.length > 0 && <button className="clear-filters" type="button" onClick={() => setSelected([])}>Limpiar filtros</button>}
        </aside>

        <section className="shop-results" aria-live="polite">
          <div className="shop-toolbar">
            <label className="shop-search"><span className="sr-only">Buscar productos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en la tienda..." /></label>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar productos">
              <option value="featured">Ordenar: Destacados</option>
              <option value="az">Nombre: A–Z</option>
              <option value="za">Nombre: Z–A</option>
            </select>
          </div>

          <p className="results-count">{visible.length} productos</p>
          <div className="shop-product-grid">
            {visible.map((product, index) => (
              <article className="shop-product-card" key={product.sku}>
                <div className="shop-product-image">
                  {index < 3 && <span className="new-badge">NUEVO</span>}
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 260px" />
                </div>
                <p>{product.category} · {product.sku}</p>
                <h2>{product.name}</h2>
                <div className="shop-card-actions">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Hola DMaestros, quiero consultar por ${product.name} (${product.sku}).`)}`} target="_blank" rel="noopener noreferrer">Consultar</a>
                </div>
              </article>
            ))}
          </div>
          {!visible.length && <div className="empty-results"><h2>Sin resultados</h2><p>Prueba con otra búsqueda o elimina los filtros seleccionados.</p></div>}
        </section>
      </div>
    </main>
  );
}
