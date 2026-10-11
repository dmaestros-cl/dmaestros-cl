import { AdminCategoryManager, type AdminCategoryRow } from "@/components/AdminCategoryManager";
import { requireAdmin } from "@/lib/admin";

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id,name,slug,active,sort_order,shipping_rm_only,products(count)").order("sort_order");
  const rows: AdminCategoryRow[] = (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    active: category.active,
    sort_order: category.sort_order,
    shipping_rm_only: category.shipping_rm_only,
    product_count: category.products[0]?.count ?? 0,
  }));
  return <>
    <AdminCategoryManager initialRows={rows} />
  </>;
}
