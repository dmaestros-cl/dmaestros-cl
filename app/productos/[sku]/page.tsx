import { notFound } from "next/navigation";
import { ProductActions } from "@/components/ProductActions";
import { ProductGallery } from "@/components/ProductGallery";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const supabase = await createClient();
  const [{ data }, { data: settings }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "sku,slug,name,description,image_url,price,sale_price,stock,available,sale_mode,youtube_url,categories(name),product_images(public_url,sort_order)",
      )
      .or(
        `slug.eq.${decodeURIComponent(sku)},sku.eq.${decodeURIComponent(sku)}`,
      )
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("store_settings")
      .select("whatsapp_number")
      .eq("id", true)
      .maybeSingle(),
  ]);
  if (!data) notFound();
  const gallery = [...data.product_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.public_url);
  const category = Array.isArray(data.categories)
    ? data.categories[0]
    : data.categories;
  const product = {
    sku: data.sku,
    slug: data.slug,
    name: data.name,
    description: data.description,
    image: data.image_url,
    images: gallery,
    price: data.price == null ? undefined : Number(data.price),
    salePrice: data.sale_price == null ? undefined : Number(data.sale_price),
    stock: data.stock,
    available: data.available,
    saleMode: data.sale_mode,
    youtubeUrl: data.youtube_url,
    category: category?.name ?? "Sin categoría",
  } as const;
  const videoEmbedUrl = getYouTubeEmbedUrl(product.youtubeUrl);
  return (
    <div className="shop-shell">
      <SiteHeader />
      <main className="product-detail-page">
        <ProductGallery name={product.name} primaryImage={product.image} images={gallery} youtubeUrl={product.youtubeUrl} price={product.price} salePrice={product.salePrice} available={product.available} />
        <section className="product-detail-copy">
          <p>
            {product.category} · {product.sku}
          </p>
          <h1>{product.name}</h1>
          {product.description && (
            <div className="product-description">{product.description}</div>
          )}
          <strong className="product-detail-price">
            {product.price == null ? (
              "Precio por cotizar"
            ) : product.salePrice ? (
              <>
                <del>${product.price.toLocaleString("es-CL")}</del> $
                {product.salePrice.toLocaleString("es-CL")}
              </>
            ) : (
              `$${product.price.toLocaleString("es-CL")}`
            )}
          </strong>
          <ProductActions
            product={product}
            whatsappNumber={settings?.whatsapp_number ?? ""}
          />
        </section>
        {videoEmbedUrl && <section className="product-detail-video"><span>Video del producto</span><h2>Conoce esta pieza en detalle</h2><div><iframe src={videoEmbedUrl} title={`Video de ${product.name}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}
      </main>
    </div>
  );
}
