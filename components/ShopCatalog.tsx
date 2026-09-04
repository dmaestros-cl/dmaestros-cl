"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { categories, normalizeSearch, products } from "@/lib/catalog";

export function ShopCatalog({ initialCategory, initialQuery = "" }: { initialCategory?: string; initialQuery?: string }) {
  const validInitialCategory = initialCategory && categories.some((category) => category === initialCategory) ? initialCategory : undefined;
  const [selected, setSelected] = useState<string[]>(validInitialCategory ? [validInitialCategory] : []);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = initialQuery;

  const visible = useMemo(() => {
    const filtered = products.filter((product) =>
      (!selected.length || selected.includes(product.category)) &&
      normalizeSearch(`${product.name} ${product.category} ${product.sku}`).includes(normalizeSearch(query)),
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
          <div className="shop-filter-heading">
            <h2>Filtros</h2>
            <button type="button" aria-expanded={filtersOpen} aria-controls="shop-filter-options" onClick={() => setFiltersOpen((open) => !open)}>
              <span className={selected.length ? "filter-status is-active" : "filter-status"}>{selected.length ? `${selected.length} activo${selected.length === 1 ? "" : "s"}` : "Ver opciones"}</span>
              <span className="filter-chevron" aria-hidden="true" />
            </button>
          </div>
          <div className={`shop-filter-options${filtersOpen ? " is-open" : ""}`} id="shop-filter-options">
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
          </div>
        </aside>

        <section className="shop-results" aria-live="polite">
          <div className="shop-toolbar">
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
                  <a href={`mailto:contacto@dmaestros.cl?subject=${encodeURIComponent(`Consulta por ${product.name} (${product.sku})`)}`}>Consultar</a>
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
