"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, setQuantity, removeFromCart } = useCart();
  const total = items.reduce((sum, item) => sum + (item.product.salePrice ?? item.product.price ?? 0) * item.quantity, 0);
  const purchasable = items.every((item) => item.product.saleMode === "buy" && item.product.price != null);
  return <div className="shop-shell"><SiteHeader /><main className={`cart-page${items.length ? "" : " is-empty"}`}><header><span>Tu compra</span><h1>Carrito</h1>{items.length > 0 && <p>{items.length} producto{items.length === 1 ? "" : "s"} en tu selección.</p>}</header>
    {items.length ? <div className="cart-layout"><section className="cart-lines">{items.map(({ product, quantity }) => <article key={product.sku}><Link href={`/productos/${encodeURIComponent(product.slug || product.sku)}`}><Image src={product.image} alt={product.name} width={110} height={110} /></Link><div><small>{product.sku}</small><h2><Link href={`/productos/${encodeURIComponent(product.slug || product.sku)}`}>{product.name}</Link></h2><strong>{product.price == null ? "Por cotizar" : `$${(product.salePrice ?? product.price).toLocaleString("es-CL")}`}</strong></div><div className="cart-quantity"><span>Cantidad</span><div role="group" aria-label={`Cantidad de ${product.name}`}><button type="button" aria-label="Disminuir cantidad" disabled={quantity <= 1} onClick={() => setQuantity(product.sku, quantity - 1)}>−</button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Aumentar cantidad" disabled={product.stock != null && product.stock > 0 && quantity >= product.stock} onClick={() => setQuantity(product.sku, quantity + 1)}>+</button></div></div><button type="button" onClick={() => removeFromCart(product.sku)}>Eliminar</button></article>)}</section><aside className="cart-summary"><h2>Resumen</h2><div><span>Subtotal</span><strong>${total.toLocaleString("es-CL")}</strong></div><p>El costo de envío se calcula al confirmar los datos.</p>{purchasable ? <Link className="cart-checkout-link" href="/checkout">Continuar compra</Link> : <p>Retira los productos que requieren cotización para continuar.</p>}</aside></div> : <section className="cart-empty-state"><span className="cart-empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.3 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg></span><span className="cart-empty-kicker">Tu selección está vacía</span><h2>Encuentra una pieza hecha para ti</h2><p>Explora nuestras colecciones y agrega al carrito los productos que quieras comprar.</p><Link href="/tienda">Explorar la tienda</Link></section>}
  </main></div>;
}
