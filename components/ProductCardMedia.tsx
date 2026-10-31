"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export function ProductCardMedia({ href, image, name, videoUrl, available = true, price, salePrice, sizes, className }: { href: string; image: string; name: string; videoUrl?: string; available?: boolean; price?: number; salePrice?: number; sizes: string; className: string }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(videoUrl, true);
  return <div className={`${className} product-card-media`}>
    {playing && embedUrl ? <iframe src={embedUrl} title={`Video de ${name}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <Link href={href} aria-label={`Ver detalles de ${name}`}><Image src={image} alt={name} fill sizes={sizes} /><span className="product-photo-details">Detalles <span aria-hidden="true">↗</span></span></Link>}
    {!playing && salePrice && price && <span className="product-sale-badge">−{Math.round((1 - salePrice / price) * 100)}%</span>}
    {!playing && !available && <span className="product-sold-overlay">Agotado</span>}
    {embedUrl && <button className={`product-video-toggle${playing ? " is-playing" : ""}`} type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Cerrar video" : `Reproducir video de ${name}`}><span aria-hidden="true">{playing ? <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg> : <svg className="is-play" viewBox="0 0 24 24"><path d="m9 7 8 5-8 5Z" /></svg>}</span>{playing ? "Cerrar" : "Ver video"}</button>}
  </div>;
}
