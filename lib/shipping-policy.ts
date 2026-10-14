export type ShippingSettings = {
  mode: "disabled" | "all" | "threshold";
  minimum_subtotal: number | null;
};

export const SHIPPING_SETTINGS_COLUMNS = "mode,minimum_subtotal";
export const MAX_SHIPPING_THRESHOLD = 999_999_999;

// Reject incomplete configuration instead of silently displaying a wrong total.
export function parseShippingSettings(value: unknown): ShippingSettings {
  if (!value || typeof value !== "object") throw new Error("Configuración de envío no disponible.");
  const row = value as Record<string, unknown>;
  if (!["disabled", "all", "threshold"].includes(String(row.mode))) throw new Error("Configuración de envío no válida.");
  const minimum = row.minimum_subtotal == null ? null : Number(row.minimum_subtotal);
  if ((minimum !== null && (!Number.isSafeInteger(minimum) || minimum < 1 || minimum > MAX_SHIPPING_THRESHOLD)) || (row.mode === "threshold" && minimum === null)) {
    throw new Error("El monto mínimo de envío no es válido.");
  }
  return { mode: row.mode as ShippingSettings["mode"], minimum_subtotal: minimum };
}

export function qualifiesForFreeShipping(subtotal: number, settings: ShippingSettings): boolean {
  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) return false;
  return settings.mode === "all" || (settings.mode === "threshold" && settings.minimum_subtotal !== null && subtotal >= settings.minimum_subtotal);
}

export function shippingCostForSubtotal(baseRate: number, subtotal: number, settings: ShippingSettings): number {
  return qualifiesForFreeShipping(subtotal, settings) ? 0 : baseRate;
}
