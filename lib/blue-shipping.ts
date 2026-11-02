import { parseProductShippingPrice } from "./product-shipping-price.ts";

export const BLUE_SOURCE_URL = "https://www.blue.cl/docs/enviar/tarifario-pyme.pdf";
export const BLUE_BANDS = ["xs", "s", "m", "l"] as const;
export const BLUE_LIMITS = [0.5, 3, 6, 20];
export const BLUE_PRODUCT_COLUMNS = "shipping_automatic,package_weight_kg,package_length_cm,package_width_cm,package_height_cm,shipping_fallback_mode,shipping_fallback_price";
export const BLUE_RATE_COLUMNS = "blue_enabled,blue_zone,blue_xs,blue_s,blue_m,blue_l";
export type BlueZone = "santiago" | "centro" | "extremo" | "pendiente";
export const BLUE_ZONE_LABELS: Record<BlueZone, string> = { santiago: "Santiago", centro: "Centro", extremo: "Extremo", pendiente: "Por confirmar" };
export const BLUE_ROUTE_LABELS: Record<string, string> = { local: "Dentro de la misma zona y región", central: "Santiago ↔ Centro / Centro entre regiones", extreme: "Desde o hacia Extremo (distinta zona o región)" };
export type BlueBand = typeof BLUE_BANDS[number];
export type BlueTariff = { region_code: string; xs: number; s: number; m: number; l: number };
export type BlueCommune = { commune_code: string; region_code: string; blue_enabled: boolean; blue_zone: BlueZone; blue_xs: number | null; blue_s: number | null; blue_m: number | null; blue_l: number | null };
export type ProductPackage = {
  shipping_automatic: boolean;
  package_weight_kg: number | null;
  package_length_cm: number | null;
  package_width_cm: number | null;
  package_height_cm: number | null;
  shipping_fallback_mode?: "coordinate" | "fixed";
  shipping_fallback_price?: number | null;
};
export type FreightSettings = { shipping_fallback_mode: "coordinate" | "fixed"; shipping_fallback_price: number | null };
export class AutomaticShippingUnavailable extends Error {}
export class FreightCoordinationRequired extends Error {}
export type BlueConfiguration = { originRegion: string | null; originZone: BlueZone | null; tariffs: BlueTariff[] };

export function parseProductPackage(row: Record<string, unknown>, requireComplete = true): ProductPackage {
  const measurement = (key: string, decimals: number) => {
    const raw = row[key];
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw !== "string" && typeof raw !== "number") throw new Error("Revisa el peso y las medidas del embalaje.");
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 1000 || Math.abs(n * 10 ** decimals - Math.round(n * 10 ** decimals)) > 0.000001) throw new Error(`Ingresa medidas positivas de hasta 1.000, con máximo ${decimals} decimales.`);
    return n;
  };
  const result = {
    shipping_automatic: true,
    package_weight_kg: measurement("package_weight_kg", 3),
    package_length_cm: measurement("package_length_cm", 1),
    package_width_cm: measurement("package_width_cm", 1),
    package_height_cm: measurement("package_height_cm", 1),
  };
  if (requireComplete && Object.entries(result).some(([key, value]) => key !== "shipping_automatic" && value === null)) throw new Error("Completa el peso, largo, ancho y alto del producto embalado para calcular el despacho automático.");
  return result;
}

export function parseFreightSettings(row: Record<string, unknown>): FreightSettings {
  const mode = row.shipping_fallback_mode ?? "coordinate";
  if (mode !== "coordinate" && mode !== "fixed") throw new Error("Selecciona cómo resolver un flete especial.");
  const price = mode === "fixed" ? parseProductShippingPrice(row.shipping_fallback_price) : null;
  if (mode === "fixed" && (price === null || price <= 0)) throw new Error("Ingresa un valor de flete especial mayor que cero.");
  return { shipping_fallback_mode: mode, shipping_fallback_price: price };
}

export function packageFromForm(form: FormData): ProductPackage & FreightSettings {
  return { ...parseProductPackage(Object.fromEntries(["package_weight_kg", "package_length_cm", "package_width_cm", "package_height_cm"].map(key => [key, form.get(key)]))),
    ...parseFreightSettings({ shipping_fallback_mode: form.get("shipping_fallback_mode") ?? "coordinate", shipping_fallback_price: form.get("shipping_fallback_price") }) };
}

export function bluePackageSize(input: ProductPackage) {
  const p = parseProductPackage({ ...input, shipping_automatic: true });
  const dimensions = [p.package_length_cm!, p.package_width_cm!, p.package_height_cm!];
  if (dimensions.some(value => value > 70)) throw new AutomaticShippingUnavailable("El embalaje supera los 70 cm por lado del tarifario automático disponible.");
  // Integer millimetres/grams avoid assigning an exact boundary to the next band.
  const volumeUnits = dimensions.reduce((total, cm) => total * Math.round(cm * 10), 1);
  const chargeUnits = Math.max(Math.round(p.package_weight_kg! * 1000) * 4000, volumeUnits);
  if (chargeUnits > 20 * 4_000_000) throw new AutomaticShippingUnavailable("El embalaje supera los 20 kg de peso real o volumétrico del tarifario automático disponible.");
  const index = BLUE_LIMITS.findIndex(limit => chargeUnits <= limit * 4_000_000);
  return { weight: chargeUnits / 4_000_000, volumetricWeight: volumeUnits / 4_000_000, band: BLUE_BANDS[index] };
}

export function blueUnitPrice(input: ProductPackage, destination: BlueCommune, config: BlueConfiguration): number {
  if (!config.originRegion) throw new Error("El origen del despacho aún no está configurado. Contacta a DMaestros.");
  if (!config.originZone || config.originZone === "pendiente" || destination.blue_zone === "pendiente") throw new Error("La zona de despacho de esta comuna requiere confirmación. Contacta a DMaestros.");
  const region = destination.region_code === config.originRegion && destination.blue_zone === config.originZone ? "local"
    : destination.blue_zone === "extremo" || config.originZone === "extremo" ? "extreme" : "central";
  const tariff = config.tariffs.find(row => row.region_code === region);
  if (!tariff) throw new Error("No hay una tarifa de despacho configurada para este destino.");
  const size = bluePackageSize(input);
  if (!destination.blue_enabled) throw new AutomaticShippingUnavailable("Este destino requiere coordinar el despacho con DMaestros.");
  const base = parseProductShippingPrice(destination[`blue_${size.band}`] ?? tariff[size.band]);
  if (base === null) throw new Error("La tarifa de despacho requiere revisión.");
  return base;
}

export function productDeliveryQuote(input: ProductPackage, destination: BlueCommune, config: BlueConfiguration): { price: number; method: "automatic" | "freight" } {
  try { return { price: blueUnitPrice(input, destination, config), method: "automatic" }; }
  catch (error) {
    if (!(error instanceof AutomaticShippingUnavailable)) throw error;
    const freight = parseFreightSettings(input);
    if (freight.shipping_fallback_mode === "fixed") return { price: freight.shipping_fallback_price!, method: "freight" };
    throw new FreightCoordinationRequired("Este producto requiere un flete especial. Confirma su valor y las condiciones de entrega con DMaestros antes de pagar.");
  }
}
