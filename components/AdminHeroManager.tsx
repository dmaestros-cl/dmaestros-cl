"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCompression, optimizeImage } from "@/lib/image-optimization";

type Slide = {
  id: string;
  mobile_image_url: string;
  desktop_image_url: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  active: boolean;
  mobile_asset_id?: string | null;
  desktop_asset_id?: string | null;
};

function HeroImagePreview({ src, mobile, title }: { src: string; mobile?: boolean; title: string }) {
  const [failed, setFailed] = useState(false);
  const label = mobile ? "Celular" : "Escritorio";

  return <figure className={`admin-hero-preview${mobile ? " is-mobile" : ""}`}>
    <figcaption><strong>{label}</strong><span>{mobile ? "Imagen vertical" : "Imagen horizontal"}</span></figcaption>
    {src ? <a href={src} target="_blank" rel="noreferrer" aria-label={`Ver imagen de ${label.toLowerCase()} de ${title} en una nueva pestaña`}>
      <div className="admin-hero-preview-frame">
        {failed ? <span className="admin-hero-preview-empty">No se pudo cargar la vista previa.</span> : <Image src={src} alt={`${title} — ${label}`} fill sizes={mobile ? "(max-width: 600px) 280px, 240px" : "(max-width: 600px) 440px, 640px"} onError={() => setFailed(true)} />}
      </div>
      <span className="admin-hero-preview-link">Ver imagen completa <span aria-hidden="true">↗</span></span>
    </a> : <div className="admin-hero-preview-frame"><span className="admin-hero-preview-empty">Sin imagen para {label.toLowerCase()}.</span></div>}
  </figure>;
}

export function AdminHeroManager({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function addSlide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const mobile = form.get("mobile") as File;
    const desktop = form.get("desktop") as File;
    if (!mobile?.size || !desktop?.size) return setMessage("Selecciona las dos imágenes requeridas.");

    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const prefix = crypto.randomUUID();
    const mobilePath = `${prefix}/mobile.webp`;
    const desktopPath = `${prefix}/desktop.webp`;
    const uploadedPaths: string[] = [];
    let createdAssetIds: string[] = [];

    try {
      setMessage("Optimizando imágenes…");
      const [optimizedMobile, optimizedDesktop] = await Promise.all([
        optimizeImage(mobile, { maxWidth: 1200, maxHeight: 2200 }),
        optimizeImage(desktop, { maxWidth: 2400, maxHeight: 1400 }),
      ]);
      for (const [path, image] of [[mobilePath, optimizedMobile], [desktopPath, optimizedDesktop]] as const) {
        const { error } = await supabase.storage.from("hero-images").upload(path, image.file, {
          contentType: "image/webp",
          cacheControl: "31536000",
        });
        if (error) throw error;
        uploadedPaths.push(path);
      }

      const alt = String(form.get("alt") || form.get("title"));
      const mobileUrl = supabase.storage.from("hero-images").getPublicUrl(mobilePath).data.publicUrl;
      const desktopUrl = supabase.storage.from("hero-images").getPublicUrl(desktopPath).data.publicUrl;
      const { data: assets, error: assetError } = await supabase.from("media_assets").insert([
        { bucket: "hero-images", storage_path: mobilePath, public_url: mobileUrl, kind: "hero-mobile", width: optimizedMobile.width, height: optimizedMobile.height, bytes: optimizedMobile.optimizedBytes, alt },
        { bucket: "hero-images", storage_path: desktopPath, public_url: desktopUrl, kind: "hero-desktop", width: optimizedDesktop.width, height: optimizedDesktop.height, bytes: optimizedDesktop.optimizedBytes, alt },
      ]).select("id,kind");
      if (assetError) throw assetError;
      createdAssetIds = assets.map((asset) => asset.id);
      const { error } = await supabase.from("hero_slides").insert({
        mobile_image_url: mobileUrl,
        desktop_image_url: desktopUrl,
        mobile_asset_id: assets.find((asset) => asset.kind === "hero-mobile")?.id,
        desktop_asset_id: assets.find((asset) => asset.kind === "hero-desktop")?.id,
        alt,
        title: String(form.get("title")),
        description: String(form.get("description")),
        cta: String(form.get("cta") || "Conoce nuestras piezas"),
        href: String(form.get("href") || "/tienda"),
        sort_order: slides.length * 10,
      });
      if (error) throw error;

      formRef.current?.reset();
      setMessage(`Diapositiva agregada. Móvil: ${formatCompression(mobile.size, optimizedMobile.optimizedBytes)}. Escritorio: ${formatCompression(desktop.size, optimizedDesktop.optimizedBytes)}.`);
      router.refresh();
    } catch (error) {
      if (createdAssetIds.length) await supabase.from("media_assets").delete().in("id", createdAssetIds);
      if (uploadedPaths.length) await supabase.storage.from("hero-images").remove(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "No fue posible guardar las imágenes.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSlide(slide: Slide) {
    setBusy(true);
    const { error } = await createClient().from("hero_slides").update({ active: !slide.active }).eq("id", slide.id);
    setBusy(false);
    setMessage(error ? error.message : "Estado actualizado.");
    if (!error) router.refresh();
  }

  async function removeSlide(slide: Slide) {
    if (slides.length <= 1) return setMessage("El hero debe conservar al menos una diapositiva.");
    setBusy(true);
    const supabase = createClient();
    const assetIds = [slide.mobile_asset_id, slide.desktop_asset_id].filter(Boolean) as string[];
    if (assetIds.length) {
      const { data: assets } = await supabase.from("media_assets").select("id,bucket,storage_path").in("id", assetIds);
      for (const asset of assets ?? []) await supabase.storage.from(asset.bucket).remove([asset.storage_path]);
    }
    const { error } = await supabase.from("hero_slides").delete().eq("id", slide.id);
    if (!error && assetIds.length) await supabase.from("media_assets").delete().in("id", assetIds);
    setBusy(false);
    setMessage(error ? error.message : "Diapositiva eliminada.");
    if (!error) router.refresh();
  }

  return <div className="admin-config-grid">
    <section className="admin-panel-card admin-hero-list">
      <header><div><span>Hero principal</span><h2>Imágenes publicadas</h2></div><b>{slides.length}</b></header>
      {slides.map((slide, index) => <article key={slide.id}>
        <div className="admin-hero-slide-heading">
          <div className="admin-hero-slide-copy"><small>Diapositiva {index + 1}</small><strong>{slide.title}</strong><span>{slide.active ? "Visible en la tienda" : "Oculta"}</span></div>
          <div className="admin-row-actions"><button disabled={busy} onClick={() => toggleSlide(slide)}>{slide.active ? "Ocultar" : "Publicar"}</button><button className="is-danger" disabled={busy} onClick={() => removeSlide(slide)}>Eliminar</button></div>
        </div>
        <div className="admin-hero-previews">
          <HeroImagePreview key={`desktop-${slide.desktop_image_url}`} src={slide.desktop_image_url} title={slide.title} />
          <HeroImagePreview key={`mobile-${slide.mobile_image_url}`} src={slide.mobile_image_url} title={slide.title} mobile />
        </div>
      </article>)}
    </section>

    <form className="admin-panel-card admin-hero-form" ref={formRef} onSubmit={addSlide}>
      <span className="admin-eyebrow">Nueva diapositiva</span><h2>Agregar imagen principal</h2><p>Usa una imagen para cada tipo de pantalla. Ambas son obligatorias.</p>
      <label>Título<input name="title" defaultValue="Creamos piezas que forman parte de tu vida" required /></label>
      <label>Descripción<textarea name="description" rows={3} defaultValue="Muebles, juguetes y decoración en maderas nobles, hechos a mano con dedicación y pasión." /></label>
      <div className="admin-hero-image-fields">
        <label className="admin-file-field admin-hero-upload is-desktop">
          <span>Imagen para escritorio</span>
          <strong>2400 × 1400 px</strong>
          <small>Formato horizontal · proporción 12:7 · JPG, PNG o WebP</small>
          <input name="desktop" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
        <label className="admin-file-field admin-hero-upload is-mobile">
          <span>Imagen para móvil</span>
          <strong>1200 × 2200 px</strong>
          <small>Formato vertical · proporción 6:11 · JPG, PNG o WebP</small>
          <input name="mobile" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
      </div>
      <div className="admin-form-row"><label>Texto del botón<input name="cta" defaultValue="Conoce nuestras piezas" /></label><label>Enlace del botón<input name="href" defaultValue="/tienda" /></label></div>
      <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Guardando…" : "Agregar al hero"}</button>
      {message && <p className="admin-form-message" role="status">{message}</p>}
    </form>
  </div>;
}
