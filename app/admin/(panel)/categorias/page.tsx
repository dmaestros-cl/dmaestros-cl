import { AdminPageHeader } from "@/components/AdminPageHeader";
import { categories as catalogCategories, products } from "@/lib/catalog";
import { requireAdmin } from "@/lib/admin";

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id,name,slug,active,sort_order").order("sort_order");
  const rows = data?.length ? data : catalogCategories.map((name, index) => ({ id: name, name, slug: name.toLowerCase().replaceAll(" ","-"), active: true, sort_order: index * 10 }));
  return <>
    <AdminPageHeader eyebrow="Organización" title="Categorías" description="Ordena y controla las colecciones visibles en la tienda." action={<button className="admin-primary-button">＋ Nueva categoría</button>} />
    <section className="admin-category-grid">{rows.map((category) => <article key={category.id}><div><span>{category.name.slice(0,1)}</span><p><strong>{category.name}</strong><small>{products.filter((product) => product.category === category.name).length} productos</small></p></div><footer><code>/{category.slug}</code><b className={category.active ? "is-on" : ""}>{category.active ? "Visible" : "Oculta"}</b></footer></article>)}</section>
  </>;
}
