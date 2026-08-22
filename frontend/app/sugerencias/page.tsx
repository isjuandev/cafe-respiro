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

const VOTOS_KEY = "cafe-respiro:votos";

function getVotadas(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VOTOS_KEY) || "[]");
  } catch {
    return [];
  }
}
function setVotadas(ids: string[]) {
  localStorage.setItem(VOTOS_KEY, JSON.stringify(ids));
}

export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [form, setForm] = useState({ titulo: "", comentario: "", nombre: "", contacto: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submit, setSubmit] = useState<SubmitState>({ loading: false, error: null, success: null, duplicada: null });

  // Voto state per sugerencia
  const [votadas, setVotadasState] = useState<string[]>([]);
  const [votoForm, setVotoForm] = useState<Record<string, { nombre: string; contacto: string }>>({});
  const [votoLoading, setVotoLoading] = useState<Record<string, boolean>>({});
  const [votoError, setVotoError] = useState<Record<string, string | null>>({});
  const [expandedVoto, setExpandedVoto] = useState<string | null>(null);

  useEffect(() => {
    setVotadasState(getVotadas());
  }, []);

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
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || `Error ${res.status}`;
        throw new Error(msg);
      }
      if (data.duplicada) {
        setSubmit({ loading: false, error: null, success: null, duplicada: data.sugerencia });
      } else {
        setSubmit({ loading: false, error: null, success: "¡Sugerencia creada!", duplicada: null });
        setForm({ titulo: "", comentario: "", nombre: "", contacto: "" });
        loadSugerencias();
      }
    } catch (err) {
      setSubmit({ loading: false, error: err instanceof Error ? err.message : "Error", success: null, duplicada: null });
    }
  }

  async function handleVotar(sugerenciaId: string) {
    const f = votoForm[sugerenciaId] || { nombre: "", contacto: "" };
    if (f.nombre.trim().length < 2 || f.contacto.trim().length < 2) {
      setVotoError((prev) => ({ ...prev, [sugerenciaId]: "Nombre y contacto son obligatorios (mín 2)" }));
      return;
    }
    try {
      setVotoLoading((p) => ({ ...p, [sugerenciaId]: true }));
      setVotoError((p) => ({ ...p, [sugerenciaId]: null }));
      const res = await fetch(`/api/sugerencias/${sugerenciaId}/votos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.nombre.trim(), contacto: f.contacto.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || `Error ${res.status}`;
        // Si es duplicado, marcamos como votada igual para feedback inmediato
        if (res.status === 409) {
          const next = [...new Set([...getVotadas(), sugerenciaId])];
          setVotadas(next);
          setVotadasState(next);
        }
        throw new Error(msg);
      }
      // Éxito: guarda en localStorage y refresca ranking
      const next = [...new Set([...getVotadas(), sugerenciaId])];
      setVotadas(next);
      setVotadasState(next);
      setExpandedVoto(null);
      loadSugerencias();
    } catch (err) {
      setVotoError((p) => ({ ...p, [sugerenciaId]: err instanceof Error ? err.message : "Error" }));
    } finally {
      setVotoLoading((p) => ({ ...p, [sugerenciaId]: false }));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sugerencias</h1>
        <p className="mt-1 text-muted-foreground">Propón una película y vota por las favoritas</p>
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
              <p className="mt-1 text-amber-700">“{submit.duplicada.titulo}” ya existe. ¡Vótala!</p>
            </div>
          )}

          <Button type="submit" disabled={submit.loading}>
            {submit.loading ? "Enviando…" : "Enviar sugerencia"}
          </Button>
        </form>
      </div>

      {/* Lista con ranking */}
      <div>
        <h2 className="text-lg font-semibold">Sugerencias activas · Ranking por votos</h2>
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
            {sugerencias.map((s, idx) => {
              const yaVoto = votadas.includes(s.id);
              const votos = s._count?.votos ?? 0;
              const isTop = idx === 0 && votos > 0;
              return (
                <div
                  key={s.id}
                  className={`rounded-lg border bg-card p-4 ${isTop ? "ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                          #{idx + 1}
                        </span>
                        <h3 className="font-medium">{s.titulo}</h3>
                        {isTop && <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Top</span>}
                      </div>
                      {s.comentario && <p className="mt-1 text-sm text-muted-foreground">{s.comentario}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sugerida por {s.nombreSolicitante} · {new Date(s.createdAt).toLocaleDateString("es-UY")} ·{" "}
                        <span className="font-medium text-foreground">{votos} voto{votos !== 1 ? "s" : ""}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        size="sm"
                        variant={yaVoto ? "secondary" : "default"}
                        disabled={yaVoto || votoLoading[s.id]}
                        onClick={() => {
                          if (yaVoto) return;
                          if (expandedVoto !== s.id) {
                            setExpandedVoto(s.id);
                            // Pre-llenar con datos del form de sugerencia si existen
                            setVotoForm((prev) => ({
                              ...prev,
                              [s.id]: prev[s.id] || { nombre: form.nombre, contacto: form.contacto },
                            }));
                          } else {
                            handleVotar(s.id);
                          }
                        }}
                      >
                        {yaVoto ? "Ya votaste" : votoLoading[s.id] ? "Votando…" : expandedVoto === s.id ? "Confirmar voto" : `Votar · ${votos}`}
                      </Button>
                      {expandedVoto === s.id && !yaVoto && (
                        <div className="flex w-64 flex-col gap-2 rounded border bg-muted/50 p-2">
                          <input
                            className="rounded border bg-background px-2 py-1 text-xs"
                            placeholder="Tu nombre"
                            value={votoForm[s.id]?.nombre || ""}
                            onChange={(e) => setVotoForm((p) => ({ ...p, [s.id]: { ...p[s.id], nombre: e.target.value } }))}
                          />
                          <input
                            className="rounded border bg-background px-2 py-1 text-xs"
                            placeholder="Tu contacto"
                            value={votoForm[s.id]?.contacto || ""}
                            onChange={(e) => setVotoForm((p) => ({ ...p, [s.id]: { ...p[s.id], contacto: e.target.value } }))}
                          />
                          {votoError[s.id] && <p className="text-xs text-destructive">{votoError[s.id]}</p>}
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setExpandedVoto(null)}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => handleVotar(s.id)} disabled={!!votoLoading[s.id]}>
                              Confirmar
                            </Button>
                          </div>
                        </div>
                      )}
                      {votoError[s.id] && expandedVoto !== s.id && (
                        <p className="max-w-40 text-xs text-destructive">{votoError[s.id]}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
