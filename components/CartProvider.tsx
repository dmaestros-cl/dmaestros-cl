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
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    addToCart(product) {
      setItems((current) => {
        const existing = current.find((item) => item.product.sku === product.sku);
        if (existing) {
          return current.map((item) => item.product.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item);
        }
        return [...current, { product, quantity: 1 }];
      });
      setNotification(`${product.name} se agregó al carrito`);
    },
  }), [items]);

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
