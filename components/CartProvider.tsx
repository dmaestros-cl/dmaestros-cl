"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";

type CartLine = {
  product: CatalogProduct;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  addToCart: (product: CatalogProduct) => void;
  setQuantity: (sku: string, quantity: number) => void;
  removeFromCart: (sku: string) => void;
  clearCart: () => void;
  ready: boolean;
  completePurchase: (receiptId: string, lines: { sku: string; quantity: number }[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  useEffect(() => {
    const saved = window.localStorage.getItem("dmaestros-cart");
    let parsed: CartLine[] = [];
    try { parsed = saved ? JSON.parse(saved) : []; if (!Array.isArray(parsed)) parsed = []; } catch { window.localStorage.removeItem("dmaestros-cart"); }
    const timer = window.setTimeout(() => { setItems(parsed); setReady(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) window.localStorage.setItem("dmaestros-cart", JSON.stringify(items)); }, [items, ready]);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    ready,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    addToCart(product) {
      setItems((current) => {
        const existing = current.find((item) => item.product.sku === product.sku);
        if (existing) {
          return current.map((item) => item.product.sku === product.sku
            ? { ...item, quantity: product.stock && product.stock > 0 ? Math.min(item.quantity + 1, product.stock) : item.quantity + 1 }
            : item);
        }
        return [...current, { product, quantity: 1 }];
      });
      setNotification(`${product.name} se agregó al carrito`);
    },
    setQuantity(sku, quantity) {
      setItems((current) => quantity <= 0 ? current.filter((item) => item.product.sku !== sku) : current.map((item) => item.product.sku === sku ? { ...item, quantity: item.product.stock && item.product.stock > 0 ? Math.min(quantity, item.product.stock) : quantity } : item));
    },
    removeFromCart(sku) { setItems((current) => current.filter((item) => item.product.sku !== sku)); },
    clearCart() { setItems([]); },
    completePurchase(receiptId, lines) {
      if (!ready || window.localStorage.getItem(`dmaestros-paid-${receiptId}`)) return;
      window.localStorage.setItem(`dmaestros-paid-${receiptId}`, "1");
      const quantities = new Map(lines.map((line) => [line.sku, line.quantity]));
      setItems((current) => current.flatMap((item) => {
        const quantity = item.quantity - (quantities.get(item.product.sku) ?? 0);
        return quantity > 0 ? [{ ...item, quantity }] : [];
      }));
    },
  }), [items, ready]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {notification && (
        <div className="cart-notification" role="status" aria-live="polite">
          <span className="cart-notification-icon" aria-hidden="true">✓</span>
          <span><strong>Agregado al carrito</strong><small>{notification}</small></span>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe utilizarse dentro de CartProvider");
  return context;
}
