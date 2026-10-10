"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCompression, optimizeImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };

export function AdminProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = form.get("image") as File;
    if (!source?.size) return setMessage("Selecciona una imagen.");
    const supabase = createClient();
    const path = `${crypto.randomUUID()}/product.webp`;
    let assetId: string | undefined;
    let uploaded = false;
    setBusy(true);
    setMessage("Optimizando imagen…");

    try {
      const optimized = await optimizeImage(source, { maxWidth: 1600, maxHeight: 1600 });
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized.file, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });
      if (uploadError) throw uploadError;
      uploaded = true;
      const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      const alt = String(form.get("alt") || form.get("name"));
      const { data: asset, error: assetError } = await supabase.from("media_assets").insert({
        bucket: "product-images",
        storage_path: path,
        public_url: publicUrl,
        kind: "product",
        width: optimized.width,
        height: optimized.height,
        bytes: optimized.optimizedBytes,
        alt,
      }).select("id").single();
      if (assetError) throw assetError;
      assetId = asset.id;

      const priceValue = String(form.get("price") || "").trim();
      const { error } = await supabase.from("products").insert({
        sku: String(form.get("sku")).trim(),
        name: String(form.get("name")).trim(),
        description: String(form.get("description") || "").trim(),
        category_id: String(form.get("category_id")) || null,
        image_url: publicUrl,
        image_asset_id: asset.id,
        price: priceValue ? Number(priceValue) : null,
        stock: Number(form.get("stock") || 0),
      });
      if (error) throw error;

      formRef.current?.reset();
      setMessage(`Producto guardado. Imagen: ${formatCompression(source.size, optimized.optimizedBytes)}.`);
      router.refresh();
    } catch (error) {
      if (assetId) await supabase.from("media_assets").delete().eq("id", assetId);
      if (uploaded) await supabase.storage.from("product-images").remove([path]);
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el producto.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="admin-primary-button" type="button" onClick={() => setOpen((value) => !value)}>{open ? "Cerrar formulario" : "＋ Nuevo producto"}</button>
    {open && <form className="admin-panel-card admin-product-form" ref={formRef} onSubmit={createProduct}>
      <div className="admin-product-form-heading"><div><span className="admin-eyebrow">Catálogo</span><h2>Agregar producto</h2></div><p>La fotografía se comprime y convierte automáticamente a WebP antes de guardarse.</p></div>
      <div className="admin-form-row"><label>Nombre<input name="name" required /></label><label>SKU<input name="sku" required /></label></div>
      <label>Descripción<textarea name="description" rows={3} /></label>
      <div className="admin-form-row"><label>Categoría<select name="category_id" required><option value="">Seleccionar…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Texto alternativo<input name="alt" placeholder="Describe el producto" required /></label></div>
      <div className="admin-form-row"><label>Precio CLP<input name="price" type="number" min="0" step="1" /></label><label>Stock<input name="stock" type="number" min="0" step="1" defaultValue="0" /></label></div>
      <label className="admin-file-field">Fotografía <small>JPG, PNG o WebP · salida WebP de hasta 1600 × 1600 px</small><input name="image" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
      <button className="admin-primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar producto"}</button>
      {message && <p className="admin-form-message" role="status">{message}</p>}
    </form>}
  </>;
}
