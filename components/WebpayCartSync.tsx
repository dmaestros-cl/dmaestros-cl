"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

export function WebpayCartSync({ attemptId, receiptId, paidLines, canRetry }: { attemptId: string; receiptId: string; paidLines: { sku: string; quantity: number }[] | null; canRetry: boolean }) {
  const { completePurchase, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    if (paidLines) completePurchase(receiptId, paidLines);
    if (paidLines || canRetry) {
      try {
        const stored = JSON.parse(sessionStorage.getItem("dmaestros-webpay-attempt") ?? "null");
        if (stored?.id === attemptId) sessionStorage.removeItem("dmaestros-webpay-attempt");
      } catch { /* Do not change another checkout's pending attempt. */ }
    }
  }, [completePurchase, ready, attemptId, receiptId, paidLines, canRetry]);
  return null;
}
