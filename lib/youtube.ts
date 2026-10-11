export function getYouTubeId(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] ?? null;
    }
  } catch { return null; }
  return null;
}

export function getYouTubeEmbedUrl(value?: string | null, autoplay = false) {
  const id = getYouTubeId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0${autoplay ? "&autoplay=1" : ""}` : null;
}
