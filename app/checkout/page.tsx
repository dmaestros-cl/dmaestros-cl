"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const { items } = useCart();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [message, setMessage] = useState("");
  const [paymentConfig, setPaymentConfig] = useState<{ enabled: boolean } | null>(null);
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
    fetch("/api/payments/webpay/config", { cache: "no-store" }).then((response) => response.json()).then(setPaymentConfig).catch(() => setPaymentConfig({ enabled: false }));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("shipping_regions").select("code,name").order("sort_order"),
      supabase
        .from("shipping_rates")
        .select(
          "commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max",
        )
        .eq("active", true)
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
    if (!items.length || submitting.current || !paymentConfig?.enabled) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    if (!selectedRate && !requiresPickup) {
      setBusy(false);
      submitting.current = false;
      return setMessage("Selecciona una comuna con despacho disponible.");
    }
    try {
      const payload = {
        customer: { name: String(form.get("name")), email: String(form.get("email")), phone: String(form.get("phone")), address: String(form.get("address") ?? "") },
        items: items.map((item) => ({ sku: item.product.sku, quantity: item.quantity })),
        regionCode, communeCode: requiresPickup ? "" : communeCode, expectedTotal: total,
      };
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
      const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const stored = sessionStorage.getItem("dmaestros-webpay-attempt");
      let attempt: { id: string; fingerprint: string } | null = null;
      try { attempt = stored ? JSON.parse(stored) : null; } catch { /* Replace an invalid local attempt. */ }
      if (!attempt || attempt.fingerprint !== fingerprint) attempt = { id: crypto.randomUUID(), fingerprint };
      sessionStorage.setItem("dmaestros-webpay-attempt", JSON.stringify(attempt));
      const response = await fetch("/api/payments/webpay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, attemptId: attempt.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No pudimos iniciar el pago.");
      if (result.resultUrl === "/checkout/resultado") { window.location.assign(result.resultUrl); return; }
      const paymentUrl = new URL(result.url);
      if (!["https://webpay3g.transbank.cl", "https://webpay3gint.transbank.cl"].includes(paymentUrl.origin) || !/^[a-zA-Z0-9]{64}$/.test(result.token)) throw new Error("Respuesta de pago inválida.");
      // Card details are entered exclusively on Transbank's hosted payment page.
      const paymentForm = document.createElement("form");
      paymentForm.method = "POST";
      paymentForm.action = paymentUrl.href;
      const tokenInput = document.createElement("input");
      tokenInput.type = "hidden";
      tokenInput.name = "token_ws";
      tokenInput.value = result.token;
      paymentForm.appendChild(tokenInput);
      document.body.appendChild(paymentForm);
      paymentForm.submit();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos conectar con Webpay. Tu carrito se conserva.");
      setBusy(false);
      submitting.current = false;
    }
  }
  return (
    <div className="shop-shell">
      <SiteHeader />
      <main className="checkout-page">
        {!items.length ? (
          <section className="checkout-success"><h1>Tu carrito está vacío</h1><p>Agrega productos para continuar con el pago.</p><Link href="/tienda">Explorar la tienda</Link></section>
        ) : (
          <>
            <header>
              <span>Finalizar compra</span>
              <h1>Datos de contacto y envío</h1>
            </header>
            {paymentConfig && !paymentConfig.enabled && <div className="checkout-availability-note" role="status">El pago en línea aún no está disponible. <Link href="/informacion/contacto">Contacta a DMaestros</Link> para coordinar tu compra.</div>}
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={submit}>
                <label>
                  Nombre completo
                  <input name="name" autoComplete="name" maxLength={150} required />
                </label>
                <label>
                  Correo
                  <input name="email" type="email" autoComplete="email" maxLength={254} required />
                </label>
                <label>
                  Teléfono
                  <input name="phone" type="tel" autoComplete="tel" maxLength={30} required />
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
                    maxLength={500}
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
                    busy || !paymentConfig?.enabled || !items.length || (!selectedRate && !requiresPickup)
                  }
                >
                  {busy ? "Conectando con Webpay…" : "Pagar con Webpay Plus"}
                </button>
                <p className="checkout-payment-note">Paga con tarjeta de crédito, débito o prepago en el sitio seguro de Transbank. No guardamos los datos de tu tarjeta.</p>
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
