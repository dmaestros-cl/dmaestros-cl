"use client";

import Image from "next/image";
import { FormEvent, useId, useMemo, useState } from "react";
import { normalizeSearch, products } from "@/lib/catalog";

type ProductSearchProps = { mobile?: boolean; shop?: boolean };

export function ProductSearch({ mobile = false, shop = false }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const suggestionsId = useId();
  const normalizedQuery = normalizeSearch(query);
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return products.filter((product) =>
      normalizeSearch(`${product.name} ${product.category} ${product.sku}`).includes(normalizedQuery),
    ).slice(0, 6);
  }, [normalizedQuery]);

  const showSuggestions = focused && Boolean(normalizedQuery);
  const resultHref = (name: string) => `/tienda?buscar=${encodeURIComponent(name)}#catalogo`;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (matches[0]) window.location.assign(resultHref(matches[0].name));
  }

  return (
    <form
      className={shop ? "shop-header-search" : mobile ? "mobile-search-hit" : "search"}
      onSubmit={search}
      onFocus={() => setFocused(true)}
      onBlur={() => window.setTimeout(() => setFocused(false), 120)}
      role="search"
    >
      <input name="buscar" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." role="combobox" aria-label="Buscar productos" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls={suggestionsId} autoComplete="off" />
      <button type="submit" aria-label="Buscar"><span aria-hidden="true">⌕</span></button>
      {showSuggestions && (
        <div className="search-suggestions" id={suggestionsId} role="listbox">
          {matches.length ? matches.map((product) => (
            <a href={resultHref(product.name)} className="search-suggestion" role="option" aria-selected="false" key={product.sku}>
              <span className="search-suggestion-image"><Image src={product.image} alt="" fill sizes="64px" /></span>
              <span className="search-suggestion-copy"><strong>{product.name}</strong><small>{product.category} · {product.sku}</small></span>
              <span className="search-suggestion-arrow" aria-hidden="true">→</span>
            </a>
          )) : <p className="search-empty" role="status">No encontramos productos con “{query}”.</p>}
        </div>
      )}
    </form>
  );
}
