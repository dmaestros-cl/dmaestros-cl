import { parseProductShippingPrice } from "./product-shipping-price.ts";

export const BLUE_SOURCE_URL = "https://www.blue.cl/docs/enviar/tarifario-pyme.pdf";
export const BLUE_BANDS = ["xs", "s", "m", "l"] as const;
export const BLUE_LIMITS = [0.5, 3, 6, 20];
export const BLUE_PRODUCT_COLUMNS = "shipping_automatic,package_weight_kg,package_length_cm,package_width_cm,package_height_cm";
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
};
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

export function packageFromForm(form: FormData): ProductPackage {
  return parseProductPackage(Object.fromEntries(["package_weight_kg", "package_length_cm", "package_width_cm", "package_height_cm"].map(key => [key, form.get(key)])));
}

export function bluePackageSize(input: ProductPackage) {
  const p = parseProductPackage({ ...input, shipping_automatic: true });
  const dimensions = [p.package_length_cm!, p.package_width_cm!, p.package_height_cm!];
  if (dimensions.some(value => value > 70)) throw new Error("Este producto supera los 70 cm por lado admitidos por este servicio. Contacta a DMaestros para coordinar el despacho.");
  // Integer millimetres/grams avoid assigning an exact boundary to the next band.
  const volumeUnits = dimensions.reduce((total, cm) => total * Math.round(cm * 10), 1);
  const chargeUnits = Math.max(Math.round(p.package_weight_kg! * 1000) * 4000, volumeUnits);
  if (chargeUnits > 20 * 4_000_000) throw new Error("Este producto supera los 20 kg de peso real o volumétrico admitidos por Blue Express Emprendedores. Contacta a DMaestros para coordinar el despacho.");
  const index = BLUE_LIMITS.findIndex(limit => chargeUnits <= limit * 4_000_000);
  return { weight: chargeUnits / 4_000_000, volumetricWeight: volumeUnits / 4_000_000, band: BLUE_BANDS[index] };
}

export function blueUnitPrice(input: ProductPackage, destination: BlueCommune, config: BlueConfiguration): number {
  if (!destination.blue_enabled) throw new Error("Este destino requiere coordinar el despacho con DMaestros.");
  if (!config.originRegion) throw new Error("El origen del despacho aún no está configurado. Contacta a DMaestros.");
  const size = bluePackageSize(input);
  if (!config.originZone || config.originZone === "pendiente" || destination.blue_zone === "pendiente") throw new Error("La zona de despacho de esta comuna requiere confirmación. Contacta a DMaestros.");
  const region = destination.region_code === config.originRegion && destination.blue_zone === config.originZone ? "local"
    : destination.blue_zone === "extremo" || config.originZone === "extremo" ? "extreme" : "central";
  const tariff = config.tariffs.find(row => row.region_code === region);
  if (!tariff) throw new Error("No hay una tarifa de despacho configurada para este destino.");
  const base = parseProductShippingPrice(destination[`blue_${size.band}`] ?? tariff[size.band]);
  if (base === null) throw new Error("La tarifa de despacho requiere revisión.");
  return base;
}
