"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AdminProductGallery,
  type ProductImageRow,
} from "@/components/AdminProductGallery";
import { AdminDeleteDialog } from "@/components/AdminDeleteDialog";
import { AdminSuccessDialog } from "@/components/AdminSuccessDialog";

export type AdminProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string;
  image_url: string;
  price: number | null;
  sale_price: number | null;
  slug: string;
  stock: number;
  available: boolean;
  active: boolean;
  category_name: string;
  sale_mode: "buy" | "quote";
  product_images: ProductImageRow[];
  youtube_url: string | null;
  category_id: string | null;
};

type ProductCategoryOption = { id: string; name: string };
type ProductSortKey = "name" | "sku" | "category" | "price" | "stock" | "status";
type SortDirection = "asc" | "desc";

function SortableHeader({ label, column, sortKey, direction, onSort }: { label: string; column: ProductSortKey; sortKey: ProductSortKey | null; direction: SortDirection; onSort: (column: ProductSortKey) => void }) {
  const active = sortKey === column;
  return <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}><button className={active ? "admin-sort-button is-active" : "admin-sort-button"} type="button" onClick={() => onSort(column)}>{label}<span aria-hidden="true">{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>;
}

function ActionIcon({
  name,
}: {
  name: "edit" | "stock" | "sale" | "publish" | "delete";
}) {
  if (name === "edit")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 20h4l11-11-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </svg>
    );
  if (name === "stock")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 8.5 12 4l8 4.5v8L12 21l-8-4.5v-8Z" />
        <path d="m4.5 8.5 7.5 4 7.5-4M12 12.5V21" />
      </svg>
    );
  if (name === "sale")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 5h2l2 11h10l2-8H6M9 20h.01M17 20h.01" />
        <path d="M14 4v5M11.5 6.5h5" />
      </svg>
    );
  if (name === "publish")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

export function AdminProductTable({
  initialRows,
  categories,
}: {
  initialRows: AdminProductRow[];
  categories: ProductCategoryOption[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<AdminProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState<ProductSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const filterCategories = useMemo(() => [...new Set(rows.map((row) => row.category_name))].sort((a, b) => a.localeCompare(b, "es")), [rows]);
  const filteredRows = useMemo(() => {
    const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
    const filtered = rows.filter((row) => (category === "all" || row.category_name === category) && (!normalized || `${row.name} ${row.sku}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").includes(normalized)));
    if (!sortKey) return filtered;
    const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
    return [...filtered].sort((a, b) => {
      let first: string | number | null;
      let second: string | number | null;
      if (sortKey === "name") [first, second] = [a.name, b.name];
      else if (sortKey === "sku") [first, second] = [a.sku, b.sku];
      else if (sortKey === "category") [first, second] = [a.category_name, b.category_name];
      else if (sortKey === "price") [first, second] = [a.sale_price ?? a.price, b.sale_price ?? b.price];
      else if (sortKey === "stock") [first, second] = [a.stock, b.stock];
      else [first, second] = [a.active ? "Activo" : "Oculto", b.active ? "Activo" : "Oculto"];
      if (first == null && second == null) return collator.compare(a.name, b.name);
      if (first == null) return 1;
      if (second == null) return -1;
      const result = typeof first === "number" && typeof second === "number" ? first - second : collator.compare(String(first), String(second));
      return (sortDirection === "asc" ? result : -result) || collator.compare(a.name, b.name);
    });
  }, [rows, query, category, sortKey, sortDirection]);

  function sortBy(column: ProductSortKey) {
    if (sortKey === column) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortKey(column); setSortDirection("asc"); }
  }

  async function updateProduct(
    product: AdminProductRow,
    values: Partial<AdminProductRow>,
  ) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        product.id,
      )
    ) {
      setMessage(
        "Este producto no está vinculado a Supabase. Recarga la página para obtener los datos actuales.",
      );
      return false;
    }
    setBusyId(product.id);
    setMessage("");
    const { error } = await supabase
      .from("products")
      .update(values)
      .eq("id", product.id);
    setBusyId(null);
    if (error) {
      setMessage(error.message);
      return false;
    }
    setRows((current) =>
      current.map((row) =>
        row.id === product.id ? { ...row, ...values } : row,
      ),
    );
    return true;
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const price = String(form.get("price") || "").trim();
    const salePrice = String(form.get("sale_price") || "").trim();
    const normalPrice = price ? Number(price) : null;
    const offerPrice = salePrice ? Number(salePrice) : null;
    if (
      offerPrice != null &&
      (normalPrice == null || offerPrice >= normalPrice)
    ) {
      setMessage("El precio oferta debe ser menor que el precio normal.");
      return;
    }
    const categoryId = String(form.get("category_id") || "") || null;
    const saved = await updateProduct(editing, {
      name: String(form.get("name")).trim(),
      description: String(form.get("description") || "").trim(),
      sku: String(form.get("sku")).trim(),
      slug: String(form.get("slug")).trim(),
      price: normalPrice,
      sale_price: offerPrice,
      stock: Number(form.get("stock") || 0),
      youtube_url: String(form.get("youtube_url") || "").trim() || null,
      category_id: categoryId,
    });
    if (!saved) return;
    const categoryName = categories.find((category) => category.id === categoryId)?.name ?? "Sin categoría";
    setRows((current) => current.map((row) => row.id === editing.id ? { ...row, category_name: categoryName } : row));
    setEditing(null);
    setSuccess({ title: "Producto actualizado", message: "La información y las especificaciones del producto se guardaron correctamente." });
  }

  async function removeProduct(product: AdminProductRow) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        product.id,
      )
    ) {
      setMessage(
        "Este producto no está vinculado a Supabase. Recarga la página para obtener los datos actuales.",
      );
      return;
    }
    setBusyId(product.id);
    setMessage("");
    const { data: productAssets, error: readError } = await supabase.from("products").select("image_asset_id,product_images(asset_id)").eq("id", product.id).single();
    if (readError) { setBusyId(null); return setMessage(readError.message); }
    const assetIds = [...new Set([productAssets.image_asset_id, ...(productAssets.product_images ?? []).map((image) => image.asset_id)].filter((id): id is string => Boolean(id)))];
    const { data: assets, error: assetError } = assetIds.length ? await supabase.from("media_assets").select("id,bucket,storage_path").in("id", assetIds) : { data: [], error: null };
    if (assetError) { setBusyId(null); return setMessage(assetError.message); }
    for (const bucket of [...new Set((assets ?? []).map((asset) => asset.bucket))]) {
      const paths = (assets ?? []).filter((asset) => asset.bucket === bucket).map((asset) => asset.storage_path);
      if (paths.length) { const { error: storageError } = await supabase.storage.from(bucket).remove(paths); if (storageError) { setBusyId(null); return setMessage(`No se eliminaron los archivos: ${storageError.message}`); } }
    }
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (!error && assetIds.length) await supabase.from("media_assets").delete().in("id", assetIds);
    setBusyId(null);
    if (error) return setMessage(error.message);
    setRows((current) => current.filter((row) => row.id !== product.id));
    setDeleteTarget(null);
    setMessage("");
    setSuccess({ title: "Producto eliminado", message: `“${product.name}” y todos sus registros y fotografías fueron eliminados completamente.` });
  }

  function toggleSaleMode(product: AdminProductRow) {
    if (product.sale_mode === "quote" && product.price == null) {
      setMessage("Agrega un precio antes de habilitar la compra online.");
      return;
    }
    updateProduct(product, {
      sale_mode: product.sale_mode === "buy" ? "quote" : "buy",
    });
  }

  return (
    <>
      <section className="admin-product-filters" aria-label="Buscar y filtrar productos">
        <label><span>Buscar productos</span><div><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o SKU" /></div></label>
        <label><span>Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas las categorías</option>{filterCategories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <div className="admin-filter-count"><strong>{filteredRows.length}</strong><small>de {rows.length} productos</small></div>
      </section>
      {message && (
        <p className="admin-table-message" role="status">
          {message}
        </p>
      )}
      <section className="admin-panel-card">
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <SortableHeader label="Producto" column="name" sortKey={sortKey} direction={sortDirection} onSort={sortBy} />
                <SortableHeader label="Precio" column="price" sortKey={sortKey} direction={sortDirection} onSort={sortBy} />
                <SortableHeader label="Stock" column="stock" sortKey={sortKey} direction={sortDirection} onSort={sortBy} />
                <SortableHeader label="Estado" column="status" sortKey={sortKey} direction={sortDirection} onSort={sortBy} />
                <th className="admin-actions-heading">Acciones</th>
              </tr>
            </thead>
            <tbody>
                  {filteredRows.map((product) => {
                const busy = busyId === product.id;
                const discount =
                  product.price && product.sale_price
                    ? Math.round((1 - product.sale_price / product.price) * 100)
                    : 0;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <span>
                          {product.image_url && (
                            <Image
                              src={product.image_url}
                              alt=""
                              width={54}
                              height={54}
                            />
                          )}
                          {discount > 0 && (
                            <b className="admin-sale-badge">−{discount}%</b>
                          )}
                        </span>
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>
                      {product.price == null ? (
                        "Por cotizar"
                      ) : product.sale_price ? (
                        <span className="admin-price-offer">
                          <del>${product.price.toLocaleString("es-CL")}</del>
                          <strong>
                            ${product.sale_price.toLocaleString("es-CL")}
                          </strong>
                        </span>
                      ) : (
                        `$${Number(product.price).toLocaleString("es-CL")}`
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          product.stock <= 2
                            ? "admin-stock is-low"
                            : "admin-stock"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          product.active
                            ? "admin-status is-active"
                            : "admin-status"
                        }
                      >
                        {product.active ? "Activo" : "Oculto"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          title="Editar"
                          aria-label={`Editar ${product.name}`}
                          disabled={busy}
                          onClick={() => setEditing(product)}
                        >
                          <ActionIcon name="edit" />
                        </button>
                        <button
                          type="button"
                          title={
                            product.available
                              ? "Marcar agotado"
                              : "Marcar disponible"
                          }
                          aria-label={
                            product.available
                              ? `Marcar ${product.name} como agotado`
                              : `Marcar ${product.name} como disponible`
                          }
                          className={product.available ? "is-on" : ""}
                          disabled={busy}
                          onClick={() =>
                            updateProduct(product, {
                              available: !product.available,
                            })
                          }
                        >
                          <ActionIcon name="stock" />
                        </button>
                        <button
                          type="button"
                          title={
                            product.sale_mode === "buy"
                              ? "Cambiar a cotizar"
                              : "Habilitar compra online"
                          }
                          aria-label={
                            product.sale_mode === "buy"
                              ? `Cambiar ${product.name} a cotizar`
                              : `Habilitar compra online para ${product.name}`
                          }
                          className={product.sale_mode === "buy" ? "is-on" : ""}
                          disabled={busy}
                          onClick={() => toggleSaleMode(product)}
                        >
                          <ActionIcon name="sale" />
                        </button>
                        <button
                          type="button"
                          title={product.active ? "Despublicar" : "Publicar"}
                          aria-label={
                            product.active
                              ? `Despublicar ${product.name}`
                              : `Publicar ${product.name}`
                          }
                          className={product.active ? "is-on" : ""}
                          disabled={busy}
                          onClick={() =>
                            updateProduct(product, { active: !product.active })
                          }
                        >
                          <ActionIcon name="publish" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          aria-label={`Eliminar ${product.name}`}
                          className="is-danger"
                          disabled={busy}
                          onClick={() => setDeleteTarget(product)}
                        >
                          <ActionIcon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
                  {filteredRows.length === 0 && <tr><td className="admin-filter-empty" colSpan={7}>No encontramos productos con estos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {deleteTarget && <AdminDeleteDialog type="producto" name={deleteTarget.name} detail="También se borrarán permanentemente sus fotografías, registros de galería y archivos almacenados. Esta acción no se puede deshacer." busy={busyId === deleteTarget.id} onCancel={() => setDeleteTarget(null)} onConfirm={() => removeProduct(deleteTarget)} />}

      {success && <AdminSuccessDialog title={success.title} message={success.message} onClose={() => { setSuccess(null); router.refresh(); }} />}

      {editing && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={() => setEditing(null)}
        >
          <form
            className="admin-modal"
            onSubmit={saveEdit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="admin-eyebrow">Editar producto</span>
                <h2>{editing.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </header>
            <label>
              Nombre
              <input name="name" defaultValue={editing.name} required />
            </label>
            <label>
              Descripción y especificaciones
              <textarea
                name="description"
                rows={6}
                defaultValue={editing.description ?? ""}
                placeholder={"Material\nMedidas\nTerminación y otras características"}
                aria-describedby="edit-product-description-help"
              />
              <small id="edit-product-description-help">Incluye medidas, materiales y características. Se mostrará al abrir “Ver detalles”.</small>
            </label>
            <div className="admin-form-row">
              <label>
                SKU
                <input name="sku" defaultValue={editing.sku} required />
              </label>
              <label>
                Slug
                <input name="slug" defaultValue={editing.slug} required />
              </label>
            </div>
            <label>
              Categoría
              <select name="category_id" defaultValue={editing.category_id ?? ""}>
                <option value="">Sin categoría</option>
                {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
              </select>
            </label>
            <div className="admin-form-row">
              <label>
                Precio normal CLP
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editing.price ?? ""}
                />
              </label>
              <label>
                Precio oferta CLP
                <input
                  name="sale_price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editing.sale_price ?? ""}
                  placeholder="Sin oferta"
                />
              </label>
            </div>
            <label>
              Stock
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={editing.stock}
              />
            </label>
            <label>
              Video de YouTube
              <input name="youtube_url" type="url" defaultValue={editing.youtube_url ?? ""} placeholder="https://www.youtube.com/watch?v=..." />
            </label>
            <AdminProductGallery
              productId={editing.id}
              productName={editing.name}
              initialImages={editing.product_images}
              legacyImage={editing.image_url}
              onPrimaryChange={(url) => {
                setEditing((current) =>
                  current ? { ...current, image_url: url } : current,
                );
                setRows((current) =>
                  current.map((row) =>
                    row.id === editing.id ? { ...row, image_url: url } : row,
                  ),
                );
              }}
            />
            <button
              className="admin-primary-button"
              disabled={busyId === editing.id}
            >
              {busyId === editing.id ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
