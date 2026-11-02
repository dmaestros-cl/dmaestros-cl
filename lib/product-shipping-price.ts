export const MAX_PRODUCT_SHIPPING_PRICE = 999_999_999;

// Blank inherits the commune tariff; zero explicitly means free delivery.
export function parseProductShippingPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") throw new Error("Ingresa un valor de despacho válido en pesos chilenos.");
  if (typeof value === "string" && value.trim() === "") return null;
  const price = Number(value);
  if (!Number.isSafeInteger(price) || price < 0 || price > MAX_PRODUCT_SHIPPING_PRICE) {
    throw new Error("El despacho debe ser un monto entero entre $0 y $999.999.999.");
  }
  return price;
}

export type ProductShippingLine = { shippingPrice: number | null; quantity: number };

export type ShippingRules = {
  calculation_mode: "per_unit" | "highest";
  quantity_discount_enabled: boolean;
  quantity_discount_min_units: number;
  quantity_discount_percent: number;
};

export const SHIPPING_RULES_COLUMNS = "calculation_mode,quantity_discount_enabled,quantity_discount_min_units,quantity_discount_percent";
export const DEFAULT_SHIPPING_RULES: ShippingRules = {
  calculation_mode: "per_unit", quantity_discount_enabled: false,
  quantity_discount_min_units: 3, quantity_discount_percent: 50,
};

export function parseShippingRules(value: unknown): ShippingRules {
  if (!value || typeof value !== "object") throw new Error("Reglas de despacho no disponibles.");
  const row = value as Record<string, unknown>;
  const minimum = Number(row.quantity_discount_min_units);
  const percent = Number(row.quantity_discount_percent);
  if (!["per_unit", "highest"].includes(String(row.calculation_mode)) || typeof row.quantity_discount_enabled !== "boolean"
    || !Number.isInteger(minimum) || minimum < 1 || minimum > 4950
    || !Number.isInteger(percent) || percent < 1 || percent > 100) {
    throw new Error("Revisa la regla: mínimo de 1 a 4.950 unidades y descuento de 1% a 100%, sin decimales.");
  }
  return { calculation_mode: row.calculation_mode as ShippingRules["calculation_mode"], quantity_discount_enabled: row.quantity_discount_enabled,
    quantity_discount_min_units: minimum, quantity_discount_percent: percent };
}

export function productShippingQuote(lines: ProductShippingLine[], communePrice: number, rules: ShippingRules = DEFAULT_SHIPPING_RULES) {
  parseShippingRules(rules);
  let amount = 0;
  let highest = 0;
  let units = 0;
  let usesCommunePrice = false;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error("Cantidad de despacho no válida.");
    units += line.quantity;
    const price = parseProductShippingPrice(line.shippingPrice);
    if (price === null) usesCommunePrice = true;
    else { amount += price * line.quantity; highest = Math.max(highest, price); }
  }
  // Preserve the existing single commune charge for all unconfigured products.
  if (usesCommunePrice) {
    const price = parseProductShippingPrice(communePrice);
    if (price === null) throw new Error("Tarifa general de despacho no disponible.");
    amount += price;
    highest = Math.max(highest, price);
  }
  const base = rules.calculation_mode === "highest" ? highest : amount;
  const total = rules.quantity_discount_enabled && units >= rules.quantity_discount_min_units
    ? Math.round(base * (100 - rules.quantity_discount_percent) / 100) : base;
  return { base, discount: base - total, total };
}

export function productShippingCost(lines: ProductShippingLine[], communePrice: number, rules: ShippingRules = DEFAULT_SHIPPING_RULES): number {
  return productShippingQuote(lines, communePrice, rules).total;
}
