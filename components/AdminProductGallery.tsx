"use client";

import Image from "next/image";
import { useState } from "react";
import { optimizeImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";
import { AdminDeleteDialog } from "@/components/AdminDeleteDialog";

export type ProductImageRow = { id: string; asset_id: string; public_url: string; alt: string; sort_order: number; is_primary: boolean };

export function AdminProductGallery({ productId, productName, initialImages, legacyImage, onPrimaryChange }: { productId: string; productName: string; initialImages: ProductImageRow[]; legacyImage: string; onPrimaryChange: (url: string) => void }) {
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ProductImageRow | null>(null);
  const supabase = createClient();

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > 10) return setMessage("Puedes guardar un máximo de 10 fotografías.");
    setBusy(true); setMessage("Comprimiendo fotografías…");
    try {
      const added: ProductImageRow[] = [];
      for (const [index, file] of files.entries()) {
        const optimized = await optimizeImage(file, { maxWidth: 1800, maxHeight: 1800, quality: 0.84 });
        const path = `${productId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized.file, { contentType: "image/webp", cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        const { data: asset, error: assetError } = await supabase.from("media_assets").insert({ bucket: "product-images", storage_path: path, public_url: url, kind: "product", width: optimized.width, height: optimized.height, bytes: optimized.optimizedBytes, alt: productName }).select("id").single();
        if (assetError) throw assetError;
        const primary = images.length === 0 && index === 0;
        const { data: image, error: imageError } = await supabase.from("product_images").insert({ product_id: productId, asset_id: asset.id, public_url: url, alt: productName, sort_order: images.length + index, is_primary: primary }).select("id,asset_id,public_url,alt,sort_order,is_primary").single();
        if (imageError) throw imageError;
        added.push(image);
        if (primary) { await supabase.from("products").update({ image_url: url }).eq("id", productId); onPrimaryChange(url); }
      }
      setImages((current) => [...current, ...added]);
      setMessage(`${added.length} fotografía${added.length === 1 ? "" : "s"} optimizada${added.length === 1 ? "" : "s"} y guardada${added.length === 1 ? "" : "s"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible cargar las fotografías."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function makePrimary(image: ProductImageRow) {
    if (image.is_primary) return;
    setBusy(true);
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", image.id);
    if (!error) {
      await supabase.from("products").update({ image_url: image.public_url }).eq("id", productId);
      setImages((current) => current.map((item) => ({ ...item, is_primary: item.id === image.id })));
      onPrimaryChange(image.public_url);
    }
    setBusy(false); setMessage(error ? error.message : "Imagen principal actualizada.");
  }

  async function reorder(targetId: string) {
    if (!dragged || dragged === targetId) return;
    const next = [...images];
    const from = next.findIndex((image) => image.id === dragged);
    const to = next.findIndex((image) => image.id === targetId);
    const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
    const ordered = next.map((image, index) => ({ ...image, sort_order: index }));
    setImages(ordered); setDragged(null);
    await Promise.all(ordered.map((image) => supabase.from("product_images").update({ sort_order: image.sort_order }).eq("id", image.id)));
  }

  async function removeImage(image: ProductImageRow) {
    if (images.length <= 1) { setDeleting(null); return setMessage("El producto debe conservar al menos una fotografía."); }
    setBusy(true); setMessage("Eliminando fotografía…");
    const { data: asset, error: assetError } = await supabase.from("media_assets").select("bucket,storage_path").eq("id", image.asset_id).single();
    if (assetError) { setBusy(false); return setMessage(assetError.message); }
    const { error: storageError } = await supabase.storage.from(asset.bucket).remove([asset.storage_path]);
    if (storageError) { setBusy(false); return setMessage(storageError.message); }
    const { error: imageError } = await supabase.from("product_images").delete().eq("id", image.id);
    if (imageError) { setBusy(false); return setMessage(imageError.message); }
    await supabase.from("media_assets").delete().eq("id", image.asset_id);
    const remaining = images.filter((item) => item.id !== image.id);
    if (image.is_primary && remaining[0]) {
      await supabase.from("product_images").update({ is_primary: true }).eq("id", remaining[0].id);
      await supabase.from("products").update({ image_url: remaining[0].public_url, image_asset_id: remaining[0].asset_id }).eq("id", productId);
      remaining[0] = { ...remaining[0], is_primary: true };
      onPrimaryChange(remaining[0].public_url);
    }
    const ordered = remaining.map((item, index) => ({ ...item, sort_order: index }));
    setImages(ordered); setDeleting(null); setBusy(false); setMessage("Fotografía eliminada correctamente.");
    await Promise.all(ordered.map((item) => supabase.from("product_images").update({ sort_order: item.sort_order }).eq("id", item.id)));
  }

  return <section className="admin-gallery-editor"><header><div><strong>Fotografías</strong><small>Hasta 10 · WebP automático · arrastra para ordenar</small></div><label className="admin-gallery-upload">＋ Agregar<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy || images.length >= 10} onChange={upload} /></label></header>
    <div className="admin-gallery-grid">{!images.length && legacyImage && <div className="admin-gallery-legacy"><Image src={legacyImage} alt={productName} fill sizes="120px" /><span>Imagen actual</span></div>}{images.map((image, index) => <div className={`admin-gallery-item${image.is_primary ? " is-primary" : ""}`} key={image.id} draggable onDragStart={() => setDragged(image.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(image.id)}><Image src={image.public_url} alt={image.alt || productName} fill sizes="120px" /><span className="admin-gallery-position">{image.is_primary ? "Principal" : index + 1}</span><div className="admin-gallery-controls"><button type="button" className="is-primary-action" onClick={() => makePrimary(image)} disabled={busy || image.is_primary} aria-label={image.is_primary ? "Fotografía principal" : `Marcar fotografía ${index + 1} como principal`} title={image.is_primary ? "Imagen principal" : "Marcar como principal"}>★</button><button type="button" className="is-delete-action" onClick={() => setDeleting(image)} disabled={busy || images.length <= 1} aria-label={`Eliminar fotografía ${index + 1}`} title={images.length <= 1 ? "Debe conservar una fotografía" : "Eliminar fotografía"}>×</button></div></div>)}</div>
    {message && <p role="status">{message}</p>}
    {deleting && <AdminDeleteDialog type="fotografía" name={`${productName} · imagen ${images.findIndex((item) => item.id === deleting.id) + 1}`} detail="El archivo se eliminará permanentemente del bucket y de la base de datos. Esta acción no se puede deshacer." busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => removeImage(deleting)} />}
  </section>;
}
