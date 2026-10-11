"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Selection = { type: "image"; src: string; index: number } | { type: "video" };

export function ProductGallery({ name, primaryImage, images, youtubeUrl, price, salePrice, available }: { name: string; primaryImage: string; images: string[]; youtubeUrl?: string | null; price?: number; salePrice?: number; available: boolean }) {
  const gallery = useMemo(() => Array.from(new Set([primaryImage, ...images].filter(Boolean))), [primaryImage, images]);
  const [selection, setSelection] = useState<Selection>({ type: "image", src: primaryImage, index: 0 });
  const videoEmbedUrl = getYouTubeEmbedUrl(youtubeUrl, true);
  const itemCount = gallery.length + (videoEmbedUrl ? 1 : 0);
  const currentIndex = selection.type === "video" ? gallery.length : Math.max(0, gallery.indexOf(selection.src));

  function selectAt(index: number) {
    const normalized = (index + itemCount) % itemCount;
    if (videoEmbedUrl && normalized === gallery.length) setSelection({ type: "video" });
    else setSelection({ type: "image", src: gallery[normalized], index: normalized });
  }

  return <div className="product-gallery">
    <div className={`product-detail-image${selection.type === "video" ? " is-video" : ""}`}>
      {selection.type === "video" && videoEmbedUrl ? <iframe src={videoEmbedUrl} title={`Video de ${name}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : selection.type === "image" && <Image src={selection.src} alt={`${name}, imagen ${selection.index + 1}`} fill sizes="(max-width: 850px) 100vw, 50vw" priority={selection.index === 0} />}
      {selection.type === "image" && salePrice && price && <span className="product-sale-badge is-large">−{Math.round((1 - salePrice / price) * 100)}%</span>}
      {selection.type === "image" && !available && <span className="product-sold-overlay is-large">Agotado</span>}
      {itemCount > 1 && <><button className="product-gallery-arrow is-prev" type="button" onClick={() => selectAt(currentIndex - 1)} aria-label="Ver elemento anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button><button className="product-gallery-arrow is-next" type="button" onClick={() => selectAt(currentIndex + 1)} aria-label="Ver elemento siguiente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></button></>}
    </div>
    {(gallery.length > 1 || videoEmbedUrl) && <div className="product-detail-thumbs" aria-label="Galería del producto">
      {gallery.map((image, index) => <button className={selection.type === "image" && selection.src === image ? "is-active" : ""} type="button" key={image} onClick={() => setSelection({ type: "image", src: image, index })} aria-label={`Mostrar imagen ${index + 1} de ${name}`} aria-pressed={selection.type === "image" && selection.src === image}><Image src={image} alt="" fill sizes="90px" /></button>)}
      {videoEmbedUrl && <button className={`product-video-thumb${selection.type === "video" ? " is-active" : ""}`} type="button" onClick={() => setSelection({ type: "video" })} aria-label={`Reproducir video de ${name} en el visor`} aria-pressed={selection.type === "video"}><span aria-hidden="true">▶</span><small>Video</small></button>}
    </div>}
  </div>;
}
