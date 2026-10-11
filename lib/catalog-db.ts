import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CatalogProduct } from "@/lib/catalog";

export async function getPublicCatalog() {
  const supabase = await createClient();
  const [
    { data: productRows, error: productError },
    { data: categoryRows, error: categoryError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "sku,slug,name,description,image_url,price,sale_price,stock,available,sale_mode,youtube_url,categories!inner(name,active),product_images(public_url,sort_order)",
      )
      .eq("active", true)
      .eq("categories.active", true)
      .order("created_at"),
    supabase
      .from("categories")
      .select("name")
      .eq("active", true)
      .order("sort_order"),
  ]);
  if (productError) throw productError;
  if (categoryError) throw categoryError;
  const products: CatalogProduct[] = (productRows ?? []).map((product) => {
    const category = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories;
    return {
      sku: product.sku,
      name: product.name,
      image: product.image_url,
      price: product.price == null ? undefined : Number(product.price),
      description: product.description,
      saleMode: product.sale_mode,
      salePrice:
        product.sale_price == null ? undefined : Number(product.sale_price),
      slug: product.slug,
      stock: product.stock,
      available: product.available,
      youtubeUrl: product.youtube_url ?? undefined,
      images: [...product.product_images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => image.public_url),
      category: category?.name ?? "Sin categoría",
    };
  });
  const { data: settings } = await supabase
    .from("store_settings")
    .select("whatsapp_number")
    .eq("id", true)
    .maybeSingle();
  return {
    products,
    categories: (categoryRows ?? []).map((category) => category.name),
    whatsappNumber: settings?.whatsapp_number ?? "",
  };
}
