"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; categoriaId: string; nombre: string; descripcion?: string | null; precio: number; disponible: boolean; orden: number };
type Categoria = { id: string; nombre: string; orden: number; items: Item[] };
type ItemForm = { categoriaId: string; nombre: string; descripcion: string; precio: string; orden: string };

const emptyItem: ItemForm = { categoriaId: "", nombre: "", descripcion: "", precio: "", orden: "0" };

export default function AdminMenuPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/admin/menu", { credentials: "include" });
      if (res.status === 401 || res.status === 403) { router.push("/admin/login"); return; }
      if (!res.ok) throw new Error("No se pudo cargar el menú");
      const data = await res.json();
      setCategorias(data.categorias || []);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar el menú"); }
  }

  useEffect(() => { load(); }, []);

  async function request(path: string, options: RequestInit) {
    setSaving(true); setError(null); setMessage(null);
    try {
      const res = await fetch(`/api/admin/menu${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "No se pudo guardar");
      await load();
      return data;
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar"); return null; }
    finally { setSaving(false); }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const result = await request("/categorias", { method: "POST", body: JSON.stringify({ nombre: categoryName.trim() }) });
    if (result) { setCategoryName(""); setMessage("Categoría creada"); }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    const body = { categoriaId: itemForm.categoriaId, nombre: itemForm.nombre.trim(), descripcion: itemForm.descripcion.trim() || undefined, precio: Number(itemForm.precio), orden: Number(itemForm.orden) || 0 };
    const result = await request(editingItem ? `/items/${editingItem}` : "/items", { method: editingItem ? "PATCH" : "POST", body: JSON.stringify(body) });
    if (result) { setItemForm(emptyItem); setEditingItem(null); setMessage(editingItem ? "Ítem actualizado" : "Ítem creado"); }
  }

  async function toggle(item: Item) {
    const result = await request(`/items/${item.id}/disponibilidad`, { method: "PATCH" });
    if (result) setMessage(`${item.nombre}: ${item.disponible ? "agotado" : "disponible"}`);
  }

  function edit(item: Item) { setEditingItem(item.id); setItemForm({ categoriaId: item.categoriaId, nombre: item.nombre, descripcion: item.descripcion || "", precio: String(item.precio), orden: String(item.orden) }); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function remove(path: string, label: string) {
    if (!window.confirm(`¿Eliminar ${label}?`)) return;
    const result = await request(path, { method: "DELETE" });
    if (result) setMessage("Eliminado");
  }

  if (categorias === null && !error) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-white/5" /><div className="h-64 animate-pulse rounded-xl bg-white/5" /></div>;

  return <div className="space-y-6" aria-live="polite">
    <div><h1 className="text-2xl font-bold text-white">Menú</h1><p className="mt-1 text-sm text-white/60">Gestiona categorías, precios y disponibilidad diaria.</p></div>
    {error && <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}<button onClick={load} className="ml-3 underline">Reintentar</button></div>}
    {message && <p className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-300" role="status">{message}</p>}
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {!categorias?.length && <div className="surface-card p-8 text-center text-sm text-white/60">No hay categorías. Crea la primera para comenzar.</div>}
        {categorias?.map((category) => <section key={category.id} className="surface-card p-5" aria-labelledby={`admin-cat-${category.id}`}>
          <div className="flex items-center justify-between gap-3"><h2 id={`admin-cat-${category.id}`} className="text-sm font-bold tracking-wide text-white">{category.nombre}</h2><button onClick={() => remove(`/categorias/${category.id}`, `la categoría ${category.nombre}`)} className="text-xs text-red-300 hover:text-red-200">Eliminar</button></div>
          <div className="mt-4 space-y-2">{category.items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.nombre}</p><p className="text-xs text-white/50">{item.descripcion || "Sin descripción"} · ${item.precio.toLocaleString("es-CO")}</p></div><button onClick={() => toggle(item)} disabled={saving} className={`rounded-full px-3 py-1 text-xs font-bold ${item.disponible ? "bg-[#6B8E6B]/20 text-[#9BC49B]" : "bg-white/10 text-white/50"}`}>{item.disponible ? "Disponible" : "Agotado"}</button><button onClick={() => edit(item)} className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 hover:text-white">Editar</button><button onClick={() => remove(`/items/${item.id}`, `el ítem ${item.nombre}`)} className="text-xs text-red-300">Eliminar</button></div>)}</div>
          {!category.items.length && <p className="mt-3 text-xs text-white/40">Categoría sin ítems.</p>}
        </section>)}
      </div>
      <div className="space-y-4">
        <form onSubmit={createCategory} className="surface-card p-5"><h2 className="text-xs font-bold tracking-[0.15em] text-white">NUEVA CATEGORÍA</h2><label htmlFor="category-name" className="mt-4 block text-xs text-white/60">Nombre</label><input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="control-dark mt-1 w-full px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8B86A]" placeholder="Cafetería" required /><button disabled={saving} className="mt-3 w-full rounded-lg bg-[#E8B86A] py-2 text-sm font-bold text-black disabled:opacity-50">Crear categoría</button></form>
        <form onSubmit={saveItem} className="surface-card p-5"><h2 className="text-xs font-bold tracking-[0.15em] text-white">{editingItem ? "EDITAR ÍTEM" : "NUEVO ÍTEM"}</h2><label htmlFor="item-category" className="mt-4 block text-xs text-white/60">Categoría</label><select id="item-category" value={itemForm.categoriaId} onChange={(e) => setItemForm({ ...itemForm, categoriaId: e.target.value })} className="control-dark mt-1 w-full px-3 py-2 text-sm" required><option value="">Selecciona una categoría</option>{categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select><label htmlFor="item-name" className="mt-3 block text-xs text-white/60">Nombre</label><input id="item-name" value={itemForm.nombre} onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })} className="control-dark mt-1 w-full px-3 py-2 text-sm" required /><label htmlFor="item-description" className="mt-3 block text-xs text-white/60">Descripción</label><textarea id="item-description" value={itemForm.descripcion} onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })} className="control-dark mt-1 w-full px-3 py-2 text-sm" rows={2} /><label htmlFor="item-price" className="mt-3 block text-xs text-white/60">Precio (COP)</label><input id="item-price" type="number" min="0" value={itemForm.precio} onChange={(e) => setItemForm({ ...itemForm, precio: e.target.value })} className="control-dark mt-1 w-full px-3 py-2 text-sm" required /><div className="mt-4 flex gap-2"><button disabled={saving} className="flex-1 rounded-lg bg-[#E8B86A] py-2 text-sm font-bold text-black disabled:opacity-50">{editingItem ? "Guardar" : "Crear ítem"}</button>{editingItem && <button type="button" onClick={() => { setEditingItem(null); setItemForm(emptyItem); }} className="rounded-lg border border-white/20 px-3 text-sm text-white">Cancelar</button>}</div></form>
      </div>
    </div>
  </div>;
}
