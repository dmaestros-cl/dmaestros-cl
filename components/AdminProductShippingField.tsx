"use client";

import { useState } from "react";
import { productShippingLabel, type ProductShippingScope } from "@/lib/product-shipping";
import { MAX_PRODUCT_SHIPPING_PRICE } from "@/lib/product-shipping-price";
import { type ProductPackage } from "@/lib/blue-shipping";

export function AdminProductShippingField({ value, price, parcel }: { value?: ProductShippingScope | null; price?: number | null; parcel?: ProductPackage }) {
  const [automatic, setAutomatic] = useState(parcel?.shipping_automatic ?? true);
  return <><label>
    Cobertura de despacho
    <select name="shipping_scope" defaultValue={value ?? ""}>
      <option value="">Sin etiqueta (usar cobertura de la categoría)</option>
      <option value="rm">{productShippingLabel("rm")}</option>
      <option value="chile">{productShippingLabel("chile")}</option>
    </select>
    <small>Se mostrará junto al precio y los botones del producto. La cobertura elegida también se aplicará al finalizar la compra.</small>
  </label>
    <label>Cálculo del despacho<select name="shipping_automatic" value={String(automatic)} onChange={event => setAutomatic(event.target.value === "true")}>
      <option value="true">Automático · peso y medidas</option>
      <option value="false">Tarifa manual</option>
    </select><small>El automático calcula cada unidad como un bulto, usando las tarifas de referencia y excepciones guardadas en Envíos.</small></label>
    <div className="admin-form-row">
      <label>Peso embalado (kg)<input name="package_weight_kg" type="number" min="0.001" max="1000" step="0.001" defaultValue={parcel?.package_weight_kg ?? ""} required={automatic} placeholder="Ej. 2.5" /></label>
      <label>Largo embalado (cm)<input name="package_length_cm" type="number" min="0.1" max="1000" step="0.1" defaultValue={parcel?.package_length_cm ?? ""} required={automatic} placeholder="Ej. 40" /></label>
      <label>Ancho embalado (cm)<input name="package_width_cm" type="number" min="0.1" max="1000" step="0.1" defaultValue={parcel?.package_width_cm ?? ""} required={automatic} placeholder="Ej. 40" /></label>
      <label>Alto embalado (cm)<input name="package_height_cm" type="number" min="0.1" max="1000" step="0.1" defaultValue={parcel?.package_height_cm ?? ""} required={automatic} placeholder="Ej. 12" /></label>
    </div>
    <small>Incluye caja y protección. Se cobra el mayor entre peso real y largo × ancho × alto ÷ 4.000. Si algún lado supera 70 cm o el peso facturable supera 20 kg, configura una tarifa manual para ese producto.</small>
    <label hidden={automatic}>
      Precio de despacho por unidad (CLP)
      <input name="shipping_price" type="number" min="0" max={MAX_PRODUCT_SHIPPING_PRICE} step="1" defaultValue={price ?? ""} placeholder="Usar tarifa manual por comuna" />
      <small>Solo se usa en modalidad manual. Escribe 0 para despacho gratis o deja vacío para usar la tarifa manual por comuna.</small>
      <small>La forma de cobro y los descuentos por cantidad se configuran en el panel Envíos → Reglas del carrito.</small>
    </label>
  </>;
}
