import Image from "next/image";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminProductForm } from "@/components/AdminProductForm";
import { products as catalogProducts } from "@/lib/catalog";
import { requireAdmin } from "@/lib/admin";

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: categories }] = await Promise.all([
    supabase.from("products").select("id,sku,name,image_url,price,stock,active,categories(name)").order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name").eq("active", true).order("sort_order"),
  ]);
  const rows = data?.length ? data : catalogProducts.map((product) => ({ id: product.sku, sku: product.sku, name: product.name, image_url: product.image, price: product.price ?? null, stock: 0, active: true, categories: { name: product.category } }));
  return <>
    <AdminPageHeader eyebrow="Catálogo" title="Productos" description={`${rows.length} productos disponibles para administrar.`} />
    <AdminProductForm categories={categories ?? []} />
    <section className="admin-panel-card"><div className="admin-table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th></tr></thead><tbody>{rows.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><span>{product.image_url && <Image src={product.image_url} alt="" width={54} height={54} />}</span><strong>{product.name}</strong></div></td><td>{product.sku}</td><td>{Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name}</td><td>{product.price == null ? "Por cotizar" : `$${Number(product.price).toLocaleString("es-CL")}`}</td><td>{product.stock}</td><td><span className={product.active ? "admin-status is-active" : "admin-status"}>{product.active ? "Activo" : "Oculto"}</span></td></tr>)}</tbody></table></div></section>
  </>;
}
