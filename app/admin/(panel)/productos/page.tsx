import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminProductForm } from "@/components/AdminProductForm";
import {
  AdminProductTable,
  type AdminProductRow,
} from "@/components/AdminProductTable";
import { requireAdmin } from "@/lib/admin";

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const [
    { data, error: productsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,sku,slug,name,image_url,price,sale_price,stock,available,active,sale_mode,youtube_url,category_id,categories(name),product_images(id,asset_id,public_url,alt,sort_order,is_primary)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id,name")
      .eq("active", true)
      .order("sort_order"),
  ]);
  const rows: AdminProductRow[] = (data ?? []).map((product) => {
    const category = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories;
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      image_url: product.image_url,
      price: product.price == null ? null : Number(product.price),
      sale_price:
        product.sale_price == null ? null : Number(product.sale_price),
      slug: product.slug,
      stock: product.stock,
      available: product.available,
      active: product.active,
      sale_mode: product.sale_mode,
      youtube_url: product.youtube_url,
      category_id: product.category_id,
      product_images: [...product.product_images].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
      category_name: category?.name ?? "Sin categoría",
    };
  });
  return (
    <>
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Productos"
        description={`${rows.length} productos disponibles para administrar.`}
        action={!productsError && !categoriesError ? <AdminProductForm categories={categories ?? []} /> : undefined}
      />
      {productsError || categoriesError ? (
        <div className="admin-alert">
          No fue posible cargar los datos desde Supabase. Recarga la página o
          revisa la conexión.
        </div>
      ) : (
        <>
          <AdminProductTable initialRows={rows} categories={categories ?? []} />
        </>
      )}
    </>
  );
}
