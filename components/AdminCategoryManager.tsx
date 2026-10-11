"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminDeleteDialog } from "@/components/AdminDeleteDialog";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminSuccessDialog } from "@/components/AdminSuccessDialog";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  product_count: number;
  shipping_rm_only: boolean;
};

function CategoryIcon({
  name,
}: {
  name: "edit" | "publish" | "shipping" | "delete";
}) {
  if (name === "edit")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 20h4l11-11-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </svg>
    );
  if (name === "publish")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  if (name === "shipping")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminCategoryManager({
  initialRows,
}: {
  initialRows: AdminCategoryRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function toggle(category: AdminCategoryRow) {
    setBusyId(category.id);
    const { error } = await supabase
      .from("categories")
      .update({ active: !category.active })
      .eq("id", category.id);
    setBusyId(null);
    if (error) return setMessage(error.message);
    setRows((current) =>
      current.map((row) =>
        row.id === category.id ? { ...row, active: !row.active } : row,
      ),
    );
  }

  async function toggleRmShipping(category: AdminCategoryRow) {
    setBusyId(category.id);
    const { error } = await supabase
      .from("categories")
      .update({ shipping_rm_only: !category.shipping_rm_only })
      .eq("id", category.id);
    setBusyId(null);
    if (error) return setMessage(error.message);
    setRows((current) =>
      current.map((row) =>
        row.id === category.id
          ? { ...row, shipping_rm_only: !row.shipping_rm_only }
          : row,
      ),
    );
    setMessage(
      category.shipping_rm_only
        ? "Despacho nacional activado para esta categoría."
        : "Despacho limitado a la Región Metropolitana; otras regiones deberán retirar en taller.",
    );
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const values = {
      name,
      slug: String(form.get("slug") || slugify(name)).trim(),
      sort_order: Number(form.get("sort_order") || 0),
    };
    setMessage("");
    setBusyId(editing?.id ?? "new");
    const result = editing
      ? await supabase
          .from("categories")
          .update(values)
          .eq("id", editing.id)
          .select("id,name,slug,active,sort_order")
          .single()
      : await supabase
          .from("categories")
          .insert(values)
          .select("id,name,slug,active,sort_order")
          .single();
    setBusyId(null);
    if (result.error) return setMessage(result.error.message);
    const saved = {
      ...result.data,
      product_count: editing?.product_count ?? 0,
      shipping_rm_only: editing?.shipping_rm_only ?? false,
    };
    setRows((current) =>
      editing
        ? current.map((row) => (row.id === editing.id ? saved : row))
        : [...current, saved].sort((a, b) => a.sort_order - b.sort_order),
    );
    setEditing(null);
    setCreating(false);
    setSuccess(
      editing
        ? { title: "Categoría actualizada", message: `Los cambios de “${saved.name}” se guardaron correctamente.` }
        : { title: "Categoría creada", message: `“${saved.name}” ya está disponible en la administración y en el catálogo.` },
    );
  }

  async function remove(category: AdminCategoryRow) {
    setBusyId(category.id);
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);
    setBusyId(null);
    if (error) return setMessage(error.message);
    setRows((current) => current.filter((row) => row.id !== category.id));
    setDeleteTarget(null);
    setMessage("");
    setSuccess({ title: "Categoría eliminada", message: `“${category.name}” fue eliminada completamente de la base de datos${category.product_count > 0 ? "; sus productos quedaron sin categoría" : ""}.` });
  }

  const open = creating || Boolean(editing);
  return (
    <>
      <AdminPageHeader
        eyebrow="Organización"
        title="Categorías"
        description="Ordena y controla las colecciones visibles en la tienda."
        action={
          <button
            className="admin-primary-button admin-list-create"
            type="button"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
          >
            ＋ Nueva categoría
          </button>
        }
      />
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
                <th>Categoría</th>
                <th>Productos</th>
                <th>Orden</th>
                <th>Estado</th>
                <th className="admin-actions-heading">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((category) => {
                const busy = busyId === category.id;
                return (
                  <tr key={category.id}>
                    <td>
                      <div className="admin-category-cell">
                        <span>{category.name.slice(0, 1)}</span>
                        <strong>{category.name}</strong>
                      </div>
                    </td>
                    <td>{category.product_count}</td>
                    <td>{category.sort_order}</td>
                    <td>
                      <span
                        className={
                          category.active
                            ? "admin-status is-active"
                            : "admin-status"
                        }
                      >
                        {category.active ? "Visible" : "Oculta"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          title="Editar"
                          aria-label={`Editar ${category.name}`}
                          disabled={busy}
                          onClick={() => {
                            setCreating(false);
                            setEditing(category);
                          }}
                        >
                          <CategoryIcon name="edit" />
                        </button>
                        <button
                          type="button"
                          title={category.active ? "Despublicar" : "Publicar"}
                          aria-label={
                            category.active
                              ? `Despublicar ${category.name}`
                              : `Publicar ${category.name}`
                          }
                          className={category.active ? "is-on" : ""}
                          disabled={busy}
                          onClick={() => toggle(category)}
                        >
                          <CategoryIcon name="publish" />
                        </button>
                        <button
                          type="button"
                          title={
                            category.shipping_rm_only
                              ? "Despacho solo en Región Metropolitana"
                              : "Activar restricción de despacho a Región Metropolitana"
                          }
                          aria-label={
                            category.shipping_rm_only
                              ? `Permitir despacho nacional para ${category.name}`
                              : `Limitar despacho de ${category.name} a Región Metropolitana`
                          }
                          className={
                            category.shipping_rm_only ? "is-restricted" : ""
                          }
                          disabled={busy}
                          onClick={() => toggleRmShipping(category)}
                        >
                          <CategoryIcon name="shipping" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          aria-label={`Eliminar ${category.name}`}
                          className="is-danger"
                          disabled={busy}
                          onClick={() => setDeleteTarget(category)}
                        >
                          <CategoryIcon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {deleteTarget && <AdminDeleteDialog type="categoría" name={deleteTarget.name} detail={deleteTarget.product_count > 0 ? `Se borrará definitivamente de la base de datos. Sus ${deleteTarget.product_count} producto${deleteTarget.product_count === 1 ? "" : "s"} se conservarán y quedarán sin categoría. Esta acción no se puede deshacer.` : "Se borrará definitivamente de la base de datos y dejará de aparecer en la tienda. Esta acción no se puede deshacer."} busy={busyId === deleteTarget.id} onCancel={() => setDeleteTarget(null)} onConfirm={() => remove(deleteTarget)} />}

      {success && <AdminSuccessDialog title={success.title} message={success.message} onClose={() => { setSuccess(null); router.refresh(); }} />}

      {open && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            setCreating(false);
            setEditing(null);
          }}
        >
          <form
            className="admin-modal admin-category-create-modal"
            onSubmit={saveCategory}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="admin-eyebrow">
                  {editing ? "Editar categoría" : "Nueva categoría"}
                </span>
                <h2>{editing?.name ?? "Crear categoría"}</h2>
                <p>Define cómo se identifica y ordena esta colección en la tienda.</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                ×
              </button>
            </header>
            <section className="admin-create-section"><div className="admin-create-section-title"><span>01</span><div><strong>Información de la categoría</strong><small>Nombre visible y dirección web</small></div></div><label>Nombre<input name="name" autoFocus defaultValue={editing?.name ?? ""} required /></label><label>Slug<input name="slug" defaultValue={editing?.slug ?? ""} placeholder="Se genera automáticamente" /></label></section>
            <section className="admin-create-section"><div className="admin-create-section-title"><span>02</span><div><strong>Organización</strong><small>Posición en la navegación y el catálogo</small></div></div><label>Orden<input name="sort_order" type="number" min="0" step="1" defaultValue={editing?.sort_order ?? rows.length * 10} /></label></section>
            <footer><button type="button" className="admin-secondary-button" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button><button className="admin-primary-button" disabled={busyId === (editing?.id ?? "new")}>{busyId ? "Guardando…" : "Guardar categoría"}</button></footer>
          </form>
        </div>
      )}
    </>
  );
}
