"use client";

import Image from "next/image";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { normalizeSearch, type CatalogProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";

type ProductSearchProps = { mobile?: boolean; shop?: boolean };

export function ProductSearch({
  mobile = false,
  shop = false,
}: ProductSearchProps) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const suggestionsId = useId();
  const normalizedQuery = normalizeSearch(query);
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("sku,name,image_url,price,stock,available,categories!inner(name,active)")
      .eq("active", true)
      .eq("categories.active", true)
      .then(({ data }) => {
        setProducts(
          (data ?? []).map((product) => {
            const category = Array.isArray(product.categories)
              ? product.categories[0]
              : product.categories;
            return {
              sku: product.sku,
              name: product.name,
              image: product.image_url,
              price: product.price == null ? undefined : Number(product.price),
              stock: product.stock,
              available: product.available,
              category: category?.name ?? "Sin categoría",
            };
          }),
        );
      });
  }, []);
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return products
      .filter((product) =>
        normalizeSearch(
          `${product.name} ${product.category} ${product.sku}`,
        ).includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [normalizedQuery, products]);

  const showSuggestions = focused && Boolean(normalizedQuery);
  const resultHref = (name: string) =>
    `/tienda?buscar=${encodeURIComponent(name)}#catalogo`;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (matches[0]) window.location.assign(resultHref(matches[0].name));
  }

  return (
    <form
      className={
        shop ? "shop-header-search" : mobile ? "mobile-search-hit" : "search"
      }
      onSubmit={search}
      onFocus={() => setFocused(true)}
      onBlur={() => window.setTimeout(() => setFocused(false), 120)}
      role="search"
    >
      <input
        name="buscar"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar..."
        role="combobox"
        aria-label="Buscar productos"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls={suggestionsId}
        autoComplete="off"
      />
      <button type="submit" aria-label="Buscar">
        <span aria-hidden="true">⌕</span>
      </button>
      {showSuggestions && (
        <div className="search-suggestions" id={suggestionsId} role="listbox">
          {matches.length ? (
            matches.map((product) => (
              <a
                href={resultHref(product.name)}
                className="search-suggestion"
                role="option"
                aria-selected="false"
                key={product.sku}
              >
                <span className="search-suggestion-image">
                  <Image src={product.image} alt="" fill sizes="64px" />
                  {product.available === false && <span className="search-sold-badge">Agotado</span>}
                </span>
                <span className="search-suggestion-copy">
                  <strong>{product.name}</strong>
                  <small>
                    {product.category} · {product.sku}
                  </small>
                </span>
                <span className="search-suggestion-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))
          ) : (
            <p className="search-empty" role="status">
              No encontramos productos con “{query}”.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
