"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { optimizeImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";
import { AdminSuccessDialog } from "@/components/AdminSuccessDialog";

type Category = { id: string; name: string };

export function AdminProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = (form.getAll("images") as File[]).filter((file) => file.size);
    if (!files.length) return setMessage("Selecciona al menos una imagen.");
    if (files.length > 10) return setMessage("Puedes cargar un máximo de 10 imágenes.");
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    const assetIds: string[] = [];
    let productId: string | undefined;
    setBusy(true);
    setMessage("Optimizando imagen…");

    try {
      const priceValue = String(form.get("price") || "").trim();
      const salePriceValue = String(form.get("sale_price") || "").trim();
      const sku = String(form.get("sku") || "").trim();
      const slug = String(form.get("slug") || "").trim();
      const { data: product, error } = await supabase.from("products").insert({
        ...(sku ? { sku } : {}),
        ...(slug ? { slug } : {}),
        name: String(form.get("name")).trim(),
        description: String(form.get("description") || "").trim(),
        category_id: String(form.get("category_id")) || null,
        price: priceValue ? Number(priceValue) : null,
        sale_price: salePriceValue ? Number(salePriceValue) : null,
        stock: Number(form.get("stock") || 0),
        sale_mode: String(form.get("sale_mode") || "quote"),
        youtube_url: String(form.get("youtube_url") || "").trim() || null,
      }).select("id,sku,slug").single();
      if (error) throw error;
      productId = product.id;
      const alt = String(form.get("alt") || form.get("name"));
      for (const [index, source] of files.entries()) {
        setMessage(`Optimizando fotografía ${index + 1} de ${files.length}…`);
        const optimized = await optimizeImage(source, { maxWidth: 1800, maxHeight: 1800, quality: 0.84 });
        const path = `${product.id}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized.file, { contentType: "image/webp", cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        const { data: asset, error: assetError } = await supabase.from("media_assets").insert({ bucket: "product-images", storage_path: path, public_url: publicUrl, kind: "product", width: optimized.width, height: optimized.height, bytes: optimized.optimizedBytes, alt }).select("id").single();
        if (assetError) throw assetError;
        assetIds.push(asset.id);
        const { error: imageError } = await supabase.from("product_images").insert({ product_id: product.id, asset_id: asset.id, public_url: publicUrl, alt, sort_order: index, is_primary: index === 0 });
        if (imageError) throw imageError;
        if (index === 0) await supabase.from("products").update({ image_url: publicUrl, image_asset_id: asset.id }).eq("id", product.id);
      }

      formRef.current?.reset();
      setMessage("");
      setSuccess(`El producto ${product.sku} fue guardado correctamente con ${files.length} fotografía${files.length === 1 ? "" : "s"}.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      if (productId) await supabase.from("products").delete().eq("id", productId);
      if (assetIds.length) await supabase.from("media_assets").delete().in("id", assetIds);
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el producto.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="admin-primary-button" type="button" onClick={() => { setMessage(""); setSuccess(""); setOpen(true); }}>＋ Nuevo producto</button>
    {open && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !busy && setOpen(false)}>
      <form className="admin-modal admin-product-create-modal" ref={formRef} onSubmit={createProduct} onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span className="admin-eyebrow">Nuevo producto</span><h2>Agregar al catálogo</h2><p>Completa la información comercial y carga hasta 10 fotografías.</p></div><button type="button" aria-label="Cerrar" disabled={busy} onClick={() => setOpen(false)}>×</button></header>
        <section className="admin-create-section"><div className="admin-create-section-title"><span>01</span><div><strong>Información principal</strong><small>Identificación y descripción del producto</small></div></div><label>Nombre<input name="name" autoFocus required /></label><div className="admin-form-row"><label>SKU<input name="sku" placeholder="Automático: DM2026001" /></label><label>Slug<input name="slug" placeholder="Automático desde el nombre" /></label></div><label>Descripción y especificaciones<textarea name="description" rows={6} placeholder={"Material\nMedidas\nTerminación y otras características"} aria-describedby="new-product-description-help" /><small id="new-product-description-help">Incluye medidas, materiales y características. Se mostrará al abrir “Ver detalles”.</small></label></section>
        <section className="admin-create-section"><div className="admin-create-section-title"><span>02</span><div><strong>Venta e inventario</strong><small>Categoría, modalidad, precios y disponibilidad</small></div></div><div className="admin-form-row"><label>Categoría<select name="category_id" required><option value="">Seleccionar…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Modalidad<select name="sale_mode" defaultValue="quote"><option value="quote">Cotizar por WhatsApp</option><option value="buy">Compra online</option></select></label></div><div className="admin-form-row"><label>Precio normal CLP<input name="price" type="number" min="0" step="1" /></label><label>Precio oferta CLP<input name="sale_price" type="number" min="0" step="1" placeholder="Opcional" /></label></div><label>Stock<input name="stock" type="number" min="0" step="1" defaultValue="0" /></label></section>
        <section className="admin-create-section"><div className="admin-create-section-title"><span>03</span><div><strong>Galería y video</strong><small>La primera fotografía será la imagen principal</small></div></div><label>Texto alternativo<input name="alt" placeholder="Describe el producto" required /></label><label>Video de YouTube <small>Pega la URL completa del video, Short o enlace youtu.be</small><input name="youtube_url" type="url" placeholder="https://www.youtube.com/watch?v=..." /></label><label className="admin-file-field">Fotografías <small>Hasta 10 JPG, PNG o WebP · compresión y conversión automática</small><input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple required /></label></section>
        {message && <p className="admin-form-message" role="status">{message}</p>}
        <footer><button className="admin-secondary-button" type="button" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button><button className="admin-primary-button" disabled={busy}>{busy ? "Guardando producto…" : "Guardar producto"}</button></footer>
      </form>
    </div>}
    {success && <AdminSuccessDialog title="Producto creado" message={success} onClose={() => setSuccess("")} />}
  </>;
}
