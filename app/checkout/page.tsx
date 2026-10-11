"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([]);
  const [rates, setRates] = useState<
    {
      commune_code: string;
      region_code: string;
      commune_name: string;
      price: number;
      estimated_days_min: number;
      estimated_days_max: number;
    }[]
  >([]);
  const [regionCode, setRegionCode] = useState("");
  const [communeCode, setCommuneCode] = useState("");
  const [restrictedSkus, setRestrictedSkus] = useState<string[]>([]);
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.product.salePrice ?? item.product.price ?? 0) * item.quantity,
    0,
  );
  const communeRates = useMemo(
    () => rates.filter((rate) => rate.region_code === regionCode),
    [rates, regionCode],
  );
  const selectedRate = rates.find((rate) => rate.commune_code === communeCode);
  const requiresPickup = Boolean(
    regionCode &&
    regionCode !== "CL-RM" &&
    items.some((item) => restrictedSkus.includes(item.product.sku)),
  );
  const shippingCost = requiresPickup ? 0 : Number(selectedRate?.price ?? 0);
  const total = subtotal + shippingCost;

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("shipping_regions").select("code,name").order("sort_order"),
      supabase
        .from("shipping_rates")
        .select(
          "commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max",
        )
        .order("commune_name"),
    ]).then(([regionResult, rateResult]) => {
      const nextRegions = regionResult.data ?? [];
      setRegions(nextRegions);
      setRates(
        (rateResult.data ?? []).map((rate) => ({
          ...rate,
          price: Number(rate.price),
        })),
      );
      setRegionCode(nextRegions[0]?.code ?? "");
    });
  }, []);

  useEffect(() => {
    const skus = items.map((item) => item.product.sku);
    if (!skus.length) return;
    createClient()
      .from("products")
      .select("sku,categories!inner(shipping_rm_only)")
      .in("sku", skus)
      .then(({ data }) => {
        setRestrictedSkus(
          (data ?? [])
            .filter(
              (product) =>
                (Array.isArray(product.categories)
                  ? product.categories[0]
                  : product.categories
                )?.shipping_rm_only,
            )
            .map((product) => product.sku),
        );
      });
  }, [items]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCommuneCode(""), 0);
    return () => window.clearTimeout(timer);
  }, [regionCode]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const orderId = crypto.randomUUID();
    if (!selectedRate && !requiresPickup) {
      setBusy(false);
      return setMessage("Selecciona una comuna con despacho disponible.");
    }
    const supabase = createClient();
    const regionName =
      regions.find((region) => region.code === regionCode)?.name ?? "";
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      customer_name: String(form.get("name")),
      customer_email: String(form.get("email")),
      customer_phone: String(form.get("phone")),
      shipping_address: String(form.get("address")),
      shipping_region: regionName,
      shipping_commune: requiresPickup
        ? "Retiro en taller"
        : selectedRate?.commune_name,
      shipping_rate_code: requiresPickup ? null : selectedRate?.commune_code,
      shipping_cost: shippingCost,
      total,
    });
    if (error) {
      setBusy(false);
      return setMessage(error.message);
    }
    const { data: products } = await supabase
      .from("products")
      .select("id,sku")
      .in(
        "sku",
        items.map((item) => item.product.sku),
      );
    const { error: itemError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: orderId,
        product_id: products?.find(
          (product) => product.sku === item.product.sku,
        )?.id,
        sku: item.product.sku,
        product_name: item.product.name,
        unit_price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
      })),
    );
    setBusy(false);
    if (itemError) return setMessage(itemError.message);
    clearCart();
    setDone(true);
  }
  return (
    <div className="shop-shell">
      <SiteHeader />
      <main className="checkout-page">
        {done ? (
          <section className="checkout-success">
            <span>✓</span>
            <h1>Pedido recibido</h1>
            <p>
              Registramos tu compra con su destino y costo de despacho. Nos
              pondremos en contacto para coordinar el pago.
            </p>
            <Link href="/tienda">Volver a la tienda</Link>
          </section>
        ) : (
          <>
            <header>
              <span>Finalizar compra</span>
              <h1>Datos de contacto y envío</h1>
            </header>
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={submit}>
                <label>
                  Nombre completo
                  <input name="name" required />
                </label>
                <label>
                  Correo
                  <input name="email" type="email" required />
                </label>
                <label>
                  Teléfono
                  <input name="phone" type="tel" required />
                </label>
                <label>
                  Región
                  <select
                    value={regionCode}
                    onChange={(event) => setRegionCode(event.target.value)}
                    required
                  >
                    <option value="">Selecciona una región</option>
                    {regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Comuna
                  <select
                    value={communeCode}
                    onChange={(event) => setCommuneCode(event.target.value)}
                    required={!requiresPickup}
                    disabled={!regionCode || requiresPickup}
                  >
                    <option value="">
                      {requiresPickup
                        ? "Retiro obligatorio en taller"
                        : "Selecciona una comuna"}
                    </option>
                    {communeRates.map((rate) => (
                      <option key={rate.commune_code} value={rate.commune_code}>
                        {rate.commune_name} · $
                        {rate.price.toLocaleString("es-CL")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkout-address">
                  {requiresPickup
                    ? "Indicaciones para el retiro"
                    : "Dirección de envío"}
                  <textarea
                    name="address"
                    rows={3}
                    required={!requiresPickup}
                    placeholder={
                      requiresPickup
                        ? "Opcional: persona que retirará o información adicional"
                        : undefined
                    }
                  />
                </label>
                {requiresPickup ? (
                  <div className="checkout-delivery-note is-pickup">
                    <strong>Retiro en taller · Sin costo</strong>
                    <span>
                      Uno de los productos del carrito tiene despacho habilitado
                      solo en la Región Metropolitana.
                    </span>
                  </div>
                ) : selectedRate ? (
                  <div className="checkout-delivery-note">
                    <strong>
                      Despacho: ${shippingCost.toLocaleString("es-CL")}
                    </strong>
                    <span>
                      Entrega estimada: {selectedRate.estimated_days_min}–
                      {selectedRate.estimated_days_max} días hábiles.
                    </span>
                  </div>
                ) : null}
                <button
                  disabled={
                    busy || !items.length || (!selectedRate && !requiresPickup)
                  }
                >
                  {busy ? "Procesando…" : "Confirmar pedido"}
                </button>
                {message && <p role="status">{message}</p>}
              </form>
              <aside className="cart-summary">
                <h2>Resumen</h2>
                <div>
                  <span>Productos</span>
                  <strong>${subtotal.toLocaleString("es-CL")}</strong>
                </div>
                <div>
                  <span>Despacho</span>
                  <strong>
                    {requiresPickup
                      ? "Retiro en taller"
                      : selectedRate
                        ? `$${shippingCost.toLocaleString("es-CL")}`
                        : "Por seleccionar"}
                  </strong>
                </div>
                <div className="checkout-total">
                  <span>Total</span>
                  <strong>${total.toLocaleString("es-CL")}</strong>
                </div>
                <p>
                  {requiresPickup
                    ? "El pedido deberá retirarse en el taller de DMaestros."
                    : "Tarifa calculada según la comuna seleccionada."}
                </p>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
