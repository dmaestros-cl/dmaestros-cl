"use client";

import { FormEvent, useState } from "react";

export function ProductSearch({ mobile = false }: { mobile?: boolean }) {
  const [message, setMessage] = useState("");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("buscar") ?? "").trim().toLocaleLowerCase("es");
    if (!query) return;
    const products = Array.from(document.querySelectorAll<HTMLElement>("[data-product-name]"));
    const match = products.find((product) => product.dataset.productName?.toLocaleLowerCase("es").includes(query));
    if (match) {
      setMessage("");
      match.scrollIntoView({ behavior: "smooth", block: "center" });
      match.classList.remove("search-match");
      window.setTimeout(() => match.classList.add("search-match"), 10);
      window.setTimeout(() => match.classList.remove("search-match"), 1800);
    } else {
      setMessage("No encontramos ese producto. Escríbenos por WhatsApp.");
    }
  }

  return (
    <form className={mobile ? "mobile-search-hit" : "search"} onSubmit={search} role="search">
      <input name="buscar" placeholder="Buscar..." aria-label="Buscar productos" />
      <button type="submit" aria-label="Buscar"><span aria-hidden="true">⌕</span></button>
      <span className="search-feedback" role="status">{message}</span>
    </form>
  );
}
