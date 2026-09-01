"use client";

import { useEffect, useState } from "react";

interface Suggestion {
  id: string;
  titulo: string;
  nombreSolicitante: string;
  estado: string;
  createdAt: string;
  _count: { votos: number };
}

export default function AdminSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadSuggestions() {
    try {
      setError(null);
      const res = await fetch("/api/admin/sugerencias", { credentials: "include" });
      if (!res.ok) {
        throw new Error("No se pudieron cargar las sugerencias");
      }
      const data = await res.json();
      setItems(data.sugerencias || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar sugerencias");
    }
  }

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function updateEstado(id: string, nuevoEstado: string) {
    try {
      setUpdatingId(id);
      setError(null);
      const res = await fetch(`/api/admin/sugerencias/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "No se pudo actualizar el estado");
      }
      await loadSuggestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  }

  function getBadgeClass(estado: string) {
    switch (estado) {
      case "GANADORA":
        return "bg-[#E8B86A]/20 text-[#E8B86A] border border-[#E8B86A]/30";
      case "PROGRAMADA":
        return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "DESCARTADA":
        return "bg-red-500/20 text-red-300 border border-red-500/30";
      default:
        return "bg-white/10 text-white/70 border border-white/10";
    }
  }

  if (items === null && !error) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Sugerencias</h2>
        <p className="mt-1 text-sm text-white/60">
          Revisa las películas propuestas por la comunidad y define su estado.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 border border-red-500/20"
        >
          <span>{error}</span>
          <button
            onClick={loadSuggestions}
            className="ml-3 rounded underline text-xs font-bold hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {items?.length === 0 && (
        <div className="surface-card p-8 text-center text-sm text-white/60">
          Aún no hay sugerencias registradas.
        </div>
      )}

      <div className="space-y-3">
        {items?.map((item) => (
          <article
            key={item.id}
            className="surface-card flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:border-white/20"
          >
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-medium text-white">{item.titulo}</h3>
              <p className="mt-1 text-xs text-white/50">
                Por <span className="text-white/80">{item.nombreSolicitante}</span> ·{" "}
                <span className="text-[#E8B86A] font-medium">{item._count?.votos || 0} votos</span> ·{" "}
                {new Date(item.createdAt).toLocaleDateString("es-CO", {
                  dateStyle: "medium",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(item.estado)}`}>
                {item.estado}
              </span>

              <select
                aria-label={`Estado de ${item.titulo}`}
                value={item.estado}
                disabled={updatingId === item.id}
                onChange={(e) => updateEstado(item.id, e.target.value)}
                className="control-dark rounded-lg px-3 py-2 text-xs font-medium focus:border-[#E8B86A]/50 focus:outline-none"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="GANADORA" disabled>
                  GANADORA (vía votación)
                </option>
                <option value="PROGRAMADA" disabled>
                  PROGRAMADA (vía función)
                </option>
                <option value="DESCARTADA">DESCARTADA</option>
              </select>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
