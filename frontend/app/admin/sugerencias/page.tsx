"use client";

import { useEffect, useState } from "react";
import { FaLightbulb, FaThumbsUp } from "react-icons/fa";

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
        return "bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/25";
      case "PROGRAMADA":
        return "bg-green-500/10 text-green-400 border border-green-500/25";
      case "DESCARTADA":
        return "bg-red-500/10 text-red-400 border border-red-500/25";
      default:
        return "bg-white/5 text-white/70 border border-white/10";
    }
  }

  if (items === null && !error) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white font-serif">Sugerencias de la Comunidad</h2>
        <p className="mt-1 text-xs text-white/60">
          Revisa las películas propuestas por los espectadores y modera su estado para las rondas de votación.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-300 border border-red-500/20"
        >
          <span>{error}</span>
          <button
            onClick={loadSuggestions}
            className="ml-3 underline font-bold hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {items?.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#111114] p-8 text-center text-xs text-white/40 italic">
          Aún no hay sugerencias registradas por la comunidad.
        </div>
      )}

      <div className="space-y-3">
        {items?.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-[#111114] flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 transition-colors hover:border-white/20"
          >
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-white font-serif">{item.titulo}</h3>
              <p className="mt-1 text-xs text-white/50">
                Propuesta por <span className="text-white/80 font-medium">{item.nombreSolicitante}</span> ·{" "}
                <span className="text-[#E8B86A] font-mono font-bold">{item._count?.votos || 0} votos</span> ·{" "}
                {new Date(item.createdAt).toLocaleDateString("es-CO", {
                  dateStyle: "medium",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${getBadgeClass(item.estado)}`}>
                {item.estado}
              </span>

              <select
                aria-label={`Estado de ${item.titulo}`}
                value={item.estado}
                disabled={updatingId === item.id}
                onChange={(e) => updateEstado(item.id, e.target.value)}
                className="rounded-xl border border-white/10 bg-[#16161A] px-3 py-2 text-xs font-medium text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
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
