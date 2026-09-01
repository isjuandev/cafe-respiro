"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaEdit, FaTrashAlt, FaImage } from "react-icons/fa";

interface MenuItem {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;
  orden: number;
}

interface MenuCategory {
  id: string;
  nombre: string;
  orden: number;
  items: MenuItem[];
}

interface ItemForm {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precio: string;
  imagenUrl: string;
  orden: string;
}

const emptyItem: ItemForm = {
  categoriaId: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagenUrl: "",
  orden: "0",
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function AdminMenuPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<MenuCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadMenu() {
    try {
      setError(null);
      const res = await fetch("/api/admin/menu", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("No se pudo cargar el menú");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.categorias || [];
      setCategorias(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el menú");
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  async function request(path: string, options: RequestInit) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/menu${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "No se pudo guardar los cambios"
        );
      }
      await loadMenu();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en la operación");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const ok = await request("/categorias", {
      method: "POST",
      body: JSON.stringify({ nombre: categoryName.trim() }),
    });
    if (ok) {
      setCategoryName("");
      setMessage("Categoría creada con éxito");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("¿Eliminar categoría? Debe estar vacía.")) return;
    const ok = await request(`/categorias/${id}`, { method: "DELETE" });
    if (ok) setMessage("Categoría eliminada");
  }

  async function saveItem(e: FormEvent) {
    e.preventDefault();
    const precioNum = Number(itemForm.precio);
    if (isNaN(precioNum) || precioNum < 0) {
      setError("Precio inválido");
      return;
    }

    const payload = {
      categoriaId: itemForm.categoriaId,
      nombre: itemForm.nombre.trim(),
      descripcion: itemForm.descripcion.trim() || undefined,
      precio: precioNum,
      imagenUrl: itemForm.imagenUrl.trim() || undefined,
      orden: Number(itemForm.orden) || 0,
    };

    if (editingItem) {
      const ok = await request(`/items/${editingItem}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (ok) {
        setEditingItem(null);
        setItemForm(emptyItem);
        setMessage("Producto actualizado correctamente");
      }
    } else {
      const ok = await request("/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (ok) {
        setItemForm(emptyItem);
        setMessage("Producto creado correctamente");
      }
    }
  }

  async function toggleAvailability(id: string) {
    await request(`/items/${id}/toggle`, { method: "PATCH" });
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    const ok = await request(`/items/${id}`, { method: "DELETE" });
    if (ok) setMessage("Producto eliminado");
  }

  function startEditItem(item: MenuItem) {
    setEditingItem(item.id);
    setItemForm({
      categoriaId: item.categoriaId,
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      precio: String(item.precio),
      imagenUrl: item.imagenUrl || "",
      orden: String(item.orden),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white font-serif">Carta y Menú de Restaurante</h2>
        <p className="mt-1 text-xs text-white/60">
          Gestiona las categorías y productos de comida, café de especialidad y bebidas de Café Respiro.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3.5 text-xs text-green-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna Izquierda: Listado de Categorías y Productos */}
        <div className="space-y-6 lg:col-span-2">
          {categorias === null && (
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
              <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
            </div>
          )}

          {categorias?.map((cat) => (
            <div key={cat.id} className="rounded-3xl border border-white/10 bg-[#111114] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 bg-[#16161A] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-white text-base font-serif">{cat.nombre}</h3>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/60">
                    {cat.items.length} productos
                  </span>
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  disabled={saving || cat.items.length > 0}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title={cat.items.length > 0 ? "Vacía la categoría antes de eliminar" : "Eliminar"}
                >
                  <FaTrashAlt />
                </button>
              </div>

              {cat.items.length === 0 ? (
                <p className="p-6 text-center text-xs text-white/40 italic">Sin productos en esta categoría</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-4 p-4 transition-colors hover:bg-white/[0.02] ${
                        !item.disponible ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.imagenUrl ? (
                          <img
                            src={item.imagenUrl}
                            alt={item.nombre}
                            className="h-12 w-12 rounded-xl object-cover border border-white/10 shrink-0 bg-black"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-[#16161A] border border-white/10 flex items-center justify-center text-white/20 shrink-0">
                            <FaImage />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">{item.nombre}</span>
                            <span className="text-xs font-mono font-bold text-[#E8B86A]">
                              {moneyFormatter.format(item.precio)}
                            </span>
                          </div>
                          {item.descripcion && (
                            <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{item.descripcion}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          disabled={saving}
                          className={`rounded-xl px-3 py-1 text-xs font-bold transition-colors ${
                            item.disponible
                              ? "bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/20"
                              : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {item.disponible ? "Disponible" : "Agotado"}
                        </button>
                        <button
                          onClick={() => startEditItem(item)}
                          disabled={saving}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={saving}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 transition-colors"
                          title="Eliminar"
                        >
                          <FaTrashAlt className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Columna Derecha: Formularios de Categoría y Producto */}
        <div className="space-y-6">
          {/* Formulario: Nueva Categoría */}
          <form onSubmit={createCategory} className="rounded-3xl border border-white/10 bg-[#111114] p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">Nueva Categoría</h3>
            <label htmlFor="cat-name" className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-white/50">
              Nombre de la categoría
            </label>
            <input
              id="cat-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
              placeholder="Ej: Panadería & Repostería"
              required
            />
            <button
              disabled={saving || !categoryName.trim()}
              className="mt-3 w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
            >
              Crear categoría
            </button>
          </form>

          {/* Formulario: Crear/Editar Producto */}
          <form onSubmit={saveItem} className="rounded-3xl border border-white/10 bg-[#111114] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
              {editingItem ? "Editar Producto" : "Nuevo Producto"}
            </h3>

            <div>
              <label htmlFor="item-category" className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                Categoría *
              </label>
              <select
                id="item-category"
                value={itemForm.categoriaId}
                onChange={(e) => setItemForm({ ...itemForm, categoriaId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
                required
              >
                <option value="">— Selecciona categoría —</option>
                {categorias?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="item-name" className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                Nombre del producto *
              </label>
              <input
                id="item-name"
                value={itemForm.nombre}
                onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
                placeholder="Ej: Sandwiche Criollo"
                required
              />
            </div>

            <div>
              <label htmlFor="item-price" className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                Precio en COP *
              </label>
              <input
                id="item-price"
                type="number"
                min="0"
                value={itemForm.precio}
                onChange={(e) => setItemForm({ ...itemForm, precio: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
                placeholder="Ej: 23000"
                required
              />
            </div>

            <div>
              <label htmlFor="item-image" className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                URL de Imagen (opcional)
              </label>
              <input
                id="item-image"
                type="url"
                value={itemForm.imagenUrl}
                onChange={(e) => setItemForm({ ...itemForm, imagenUrl: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
                placeholder="https://api.treggio.co/storage/products/..."
              />
            </div>

            <div>
              <label htmlFor="item-description" className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                Descripción (opcional)
              </label>
              <textarea
                id="item-description"
                value={itemForm.descripcion}
                onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
                placeholder="Ingredientes o notas de cata..."
                rows={2}
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                disabled={saving || !itemForm.nombre || !itemForm.categoriaId}
                className="flex-1 rounded-xl bg-[#E8B86A] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D4A574] transition-colors disabled:opacity-50"
              >
                {editingItem ? "Guardar cambios" : "Crear producto"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(emptyItem);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
