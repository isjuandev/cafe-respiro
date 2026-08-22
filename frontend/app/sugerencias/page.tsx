"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Sugerencia = {
  id: string;
  titulo: string;
  comentario?: string | null;
  nombreSolicitante: string;
  contacto: string;
  estado: string;
  createdAt: string;
  _count?: { votos: number };
};

type SubmitState = { loading: boolean; error: string | null; success: string | null; duplicada: Sugerencia | null };

export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [form, setForm] = useState({ titulo: "", comentario: "", nombre: "", contacto: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submit, setSubmit] = useState<SubmitState>({ loading: false, error: null, success: null, duplicada: null });

  async function loadSugerencias() {
    try {
      setListLoading(true);
      setListError(null);
      const res = await fetch("/api/sugerencias");
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setSugerencias(data.sugerencias);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadSugerencias();
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (form.titulo.trim().length < 2) e.titulo = "Mínimo 2 caracteres";
    if (form.titulo.trim().length > 120) e.titulo = "Máximo 120 caracteres";
    if (form.comentario && form.comentario.length > 500) e.comentario = "Máximo 500 caracteres";
    if (form.nombre.trim().length < 2) e.nombre = "Mínimo 2 caracteres";
    if (form.nombre.trim().length > 60) e.nombre = "Máximo 60 caracteres";
    if (form.contacto.trim().length < 2) e.contacto = "El contacto es obligatorio";
    if (form.contacto.trim().length > 100) e.contacto = "Máximo 100 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmit({ loading: false, error: null, success: null, duplicada: null });
    if (!validate()) return;
    try {
      setSubmit({ loading: true, error: null, success: null, duplicada: null });
      const res = await fetch("/api/sugerencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          comentario: form.comentario.trim() || undefined,
          nombre: form.nombre.trim(),
          contacto: form.contacto.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Nest ValidationPipe devuelve { message: [...] }
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || `Error ${res.status}`;
        throw new Error(msg);
      }
      if (data.duplicada) {
        setSubmit({
          loading: false,
          error: null,
          success: null,
          duplicada: data.sugerencia,
        });
      } else {
        setSubmit({ loading: false, error: null, success: "¡Sugerencia creada!", duplicada: null });
        setForm({ titulo: "", comentario: "", nombre: "", contacto: "" });
        loadSugerencias();
      }
    } catch (err) {
      setSubmit({ loading: false, error: err instanceof Error ? err.message : "Error", success: null, duplicada: null });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sugerencias</h1>
        <p className="mt-1 text-muted-foreground">Propón una película y vota por las favoritas (voto en Sprint 2)</p>
      </div>

      {/* Formulario */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Sugerir una película</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Título *</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ej: Perfect Days"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
            {errors.titulo && <p className="mt-1 text-xs text-destructive">{errors.titulo}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Comentario (opcional)</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="¿Por qué la recomiendas?"
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
            />
            {errors.comentario && <p className="mt-1 text-xs text-destructive">{errors.comentario}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tu nombre *</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej: Juan"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
              {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Contacto (email o teléfono) *</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="juan@email.com"
                value={form.contacto}
                onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              />
              {errors.contacto && <p className="mt-1 text-xs text-destructive">{errors.contacto}</p>}
            </div>
          </div>

          {submit.error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {submit.error}
            </div>
          )}
          {submit.success && (
            <div className="rounded-md border border-green-600 bg-green-50 p-3 text-sm text-green-700">{submit.success}</div>
          )}
          {submit.duplicada && (
            <div className="rounded-md border border-amber-500 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-800">Esa película ya fue sugerida</p>
              <p className="mt-1 text-amber-700">
                “{submit.duplicada.titulo}” ya existe. ¡Invita a otros a votarla cuando se habilite la votación!
              </p>
            </div>
          )}

          <Button type="submit" disabled={submit.loading}>
            {submit.loading ? "Enviando…" : "Enviar sugerencia"}
          </Button>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h2 className="text-lg font-semibold">Sugerencias activas</h2>
        {listLoading ? (
          <div className="mt-4 grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : listError ? (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <p className="font-medium text-destructive">No se pudieron cargar las sugerencias</p>
            <p className="mt-1 text-sm text-muted-foreground">{listError}</p>
            <Button variant="outline" className="mt-3" onClick={loadSugerencias}>
              Reintentar
            </Button>
          </div>
        ) : !sugerencias || sugerencias.length === 0 ? (
          <div className="mt-4 rounded-lg border bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">Aún no hay sugerencias. ¡Sé el primero!</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {sugerencias.map((s) => (
              <div key={s.id} className="rounded-lg border bg-card p-4">
                <h3 className="font-medium">{s.titulo}</h3>
                {s.comentario && <p className="mt-1 text-sm text-muted-foreground">{s.comentario}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  Sugerida por {s.nombreSolicitante} · {new Date(s.createdAt).toLocaleDateString("es-UY")}
                  {s._count ? ` · ${s._count.votos} votos` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
