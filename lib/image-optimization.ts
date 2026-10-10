export type OptimizedImage = {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
};

type OptimizationOptions = {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
};

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function optimizeImage(
  source: File,
  { maxWidth, maxHeight, quality = 0.82 }: OptimizationOptions,
): Promise<OptimizedImage> {
  if (!ALLOWED_TYPES.has(source.type)) throw new Error("Usa una imagen JPG, PNG o WebP.");
  if (source.size > MAX_SOURCE_BYTES) throw new Error("La imagen original no puede superar 20 MB.");

  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Tu navegador no pudo procesar la imagen.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("No fue posible comprimir la imagen.");
  const baseName = source.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
  return {
    file: new File([blob], `${baseName}.webp`, { type: "image/webp" }),
    width,
    height,
    originalBytes: source.size,
    optimizedBytes: blob.size,
  };
}

export function formatCompression(originalBytes: number, optimizedBytes: number) {
  const saved = Math.max(0, Math.round((1 - optimizedBytes / originalBytes) * 100));
  return `${(optimizedBytes / 1024).toFixed(0)} KB · ${saved}% menos`;
}
