"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export function ProductCardMedia({ href, image, name, videoUrl, available = true, price, salePrice, sizes, className }: { href: string; image: string; name: string; videoUrl?: string; available?: boolean; price?: number; salePrice?: number; sizes: string; className: string }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(videoUrl, true);
  return <div className={`${className} product-card-media`}>
    {playing && embedUrl ? <iframe src={embedUrl} title={`Video de ${name}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <Link href={href} aria-label={`Ver detalles de ${name}`}><Image src={image} alt={name} fill sizes={sizes} /></Link>}
    {!playing && salePrice && price && <span className="product-sale-badge">−{Math.round((1 - salePrice / price) * 100)}%</span>}
    {!playing && !available && <span className="product-sold-overlay">Agotado</span>}
    {embedUrl && <button className={`product-video-toggle${playing ? " is-playing" : ""}`} type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Cerrar video" : `Reproducir video de ${name}`}><span aria-hidden="true">{playing ? "×" : "▶"}</span>{playing ? "Cerrar" : "Ver video"}</button>}
  </div>;
}
