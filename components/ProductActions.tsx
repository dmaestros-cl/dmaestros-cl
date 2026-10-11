"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import type { CatalogProduct } from "@/lib/catalog";

function CartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h3l2.3 12.5h10.8L21 7H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>;
}

export function ProductActions({ product, whatsappNumber, compact = false }: { product: CatalogProduct; whatsappNumber: string; compact?: boolean }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const details = `/productos/${encodeURIComponent(product.slug || product.sku)}`;
  const digits = whatsappNumber.replace(/\D/g, "");
  const normalizedNumber = digits.length === 9 && digits.startsWith("9") ? `56${digits}` : digits;
  const quoteText = encodeURIComponent(
    `Hola DMaestros, quisiera cotizar el producto “${product.name}” (${product.sku}).`,
  );
  const whatsapp = `https://wa.me/${normalizedNumber}?text=${quoteText}`;

  return <div className={`product-commerce-actions${compact ? " is-compact" : ""}`}>
    <Link className="product-details-link" href={details}>Ver detalles</Link>
    {product.saleMode === "quote" || product.available === false ? (
      <a className="product-primary-action is-quote" href={normalizedNumber ? whatsapp : details}>Cotizar</a>
    ) : <>
      <button className="product-cart-icon" type="button" aria-label={`Agregar ${product.name} al carrito`} title="Agregar al carrito" onClick={() => addToCart(product)}><CartIcon /><span className="cart-add-plus" aria-hidden="true">+</span></button>
      <button className="product-primary-action" type="button" onClick={() => { addToCart(product); router.push("/carrito"); }}>Comprar</button>
    </>}
  </div>;
}
