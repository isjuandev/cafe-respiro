"use client";

import { useEffect, useState } from "react";
import { FaVoteYea, FaPlus, FaCheckCircle, FaClock, FaHistory } from "react-icons/fa";

interface Suggestion {
  id: string;
  titulo: string;
  estado: string;
  votacionId?: string | null;
  _count: { votos: number };
}

interface Round {
  id: string;
  estado: string;
  cierraAt: string;
  iniciaAt?: string;
  ganadora?: { id: string; titulo: string } | null;
  sugerencias: Suggestion[];
}

const defaultCloseAt = () => {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  date.setSeconds(0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export default function AdminVotingPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [closeAt, setCloseAt] = useState(defaultCloseAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    try {
      setError(null);
      const [suggestionsRes, roundsRes] = await Promise.all([
        fetch("/api/admin/sugerencias", { credentials: "include" }),
        fetch("/api/admin/votaciones", { credentials: "include" }),
      ]);

      if (!suggestionsRes.ok || !roundsRes.ok) {
        throw new Error("No se pudieron cargar las votaciones");
      }

      const sData = await suggestionsRes.json();
      const rData = await roundsRes.json();

      setItems(sData.sugerencias || []);
      setRounds(rData || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createVoting() {
    if (!selected.length) {
      setError("Debes seleccionar al menos una película para la ronda");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/votaciones", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cierraAt: new Date(`${closeAt}T18:00:00`).toISOString(),
          sugerenciaIds: selected,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudo crear la ronda de votación");
      }

      setMessage("Ronda de votación creada correctamente. Cierre programado a las 6:00 PM.");
      setSelected([]);
      setCloseAt(defaultCloseAt());
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear votación");
    } finally {
      setBusy(false);
    }
  }

  async function closeVoting() {
    if (!window.confirm("¿Estás seguro de cerrar la votación activa antes de su hora programada?")) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/votaciones/cerrar", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudo cerrar la votación");
      }

      setMessage(
        data.ganadoraId
          ? "Votación cerrada exitosamente. La película ganadora ya está lista para programar."
          : "Votación cerrada sin votos registrados."
      );
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cerrar votación");
    } finally {
      setBusy(false);
    }
  }

  const active = rounds.find((round) => round.estado === "ACTIVA");
  const available = items.filter((item) => item.estado === "PENDIENTE" && !item.votacionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-serif">Votaciones del Cineclub</h2>
          <p className="mt-1 text-xs text-white/60">
            Crea rondas participativas, consulta resultados deterministas y programa las películas elegidas por la comunidad.
          </p>
        </div>

        {active && (
          <button
            onClick={closeVoting}
            disabled={busy}
            className="rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-40"
          >
            {busy ? "Procesando..." : "Cerrar votación activa"}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-300 border border-red-500/20"
        >
          <span>{error}</span>
          <button onClick={loadData} className="ml-3 underline font-bold hover:text-white">
            Reintentar
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className="rounded-2xl bg-green-500/10 px-4 py-3 text-xs text-green-300 border border-green-500/20"
        >
          {message}
        </p>
      )}

      {!active && (
        <section className="rounded-3xl border border-white/10 bg-[#111114] space-y-4 p-5 sm:p-6">
          <div>
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <FaPlus className="text-[#E8B86A] text-xs" /> Nueva Ronda de Votación
            </h3>
            <p className="mt-0.5 text-xs text-white/50">
              Selecciona las películas sugeridas que competirán. El cierre ocurrirá a las 6:00 PM de la fecha elegida.
            </p>
          </div>

          <label className="block max-w-xs text-[10px] font-bold uppercase tracking-widest text-white/50">
            Fecha de Cierre (6:00 PM)
            <input
              type="date"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
            />
          </label>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Películas Pendientes Disponibles ({available.length})
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {available.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                    selected.includes(item.id)
                      ? "border-[#E8B86A]/40 bg-[#E8B86A]/10 text-white"
                      : "border-white/5 bg-[#16161A] text-white/80 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id)
                      )
                    }
                    className="rounded border-white/20 bg-black/40 text-[#E8B86A] focus:ring-0"
                  />
                  <span className="truncate font-bold">{item.titulo}</span>
                  <span className="ml-auto shrink-0 font-mono font-bold text-[#E8B86A]">
                    {item._count.votos} votos
                  </span>
                </label>
              ))}
              {!available.length && (
                <p className="col-span-full py-4 text-center text-xs text-white/40 italic">
                  No hay sugerencias pendientes disponibles para iniciar una ronda.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={createVoting}
            disabled={busy || !selected.length}
            className="rounded-xl bg-[#E8B86A] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D4A574] transition-colors disabled:opacity-40"
          >
            {busy ? "Creando..." : `Crear ronda con ${selected.length} películas`}
          </button>
        </section>
      )}

      {active && (
        <section className="rounded-3xl border border-[#E8B86A]/30 bg-[#111114] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="rounded-full bg-[#E8B86A]/10 border border-[#E8B86A]/25 px-3 py-1 text-[10px] font-bold text-[#E8B86A]">
                RONDA EN CURSO
              </span>
              <p className="mt-2 text-xs text-white/70">
                Cierra el{" "}
                <strong className="text-white">
                  {new Date(active.cierraAt).toLocaleString("es-CO", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </strong>
              </p>
            </div>
            <span className="text-xs font-bold text-[#E8B86A]">
              {active.sugerencias.length} películas compitiendo
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.sugerencias.map((sug) => (
              <div
                key={sug.id}
                className="flex items-center justify-between rounded-xl bg-[#16161A] p-3 border border-white/5"
              >
                <span className="truncate text-xs font-bold text-white">{sug.titulo}</span>
                <span className="ml-2 font-mono font-bold text-[#E8B86A]">
                  {sug._count?.votos || 0} votos
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historial de rondas */}
      <section className="rounded-3xl border border-white/10 bg-[#111114] p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A] flex items-center gap-2">
          <FaHistory /> Historial de Rondas
        </h3>
        <div className="space-y-3">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#16161A] p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      round.estado === "ACTIVA"
                        ? "bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {round.estado}
                  </span>
                  <span className="text-[11px] text-white/50">
                    {new Date(round.cierraAt).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {round.ganadora && (
                  <p className="mt-1.5 text-xs font-bold text-white">
                    Ganadora: <span className="text-[#E8B86A] font-serif">{round.ganadora.titulo}</span>
                  </p>
                )}
              </div>
              <span className="text-[11px] text-white/40">
                {round.sugerencias?.length || 0} títulos participantes
              </span>
            </div>
          ))}
          {!rounds.length && (
            <p className="py-4 text-center text-xs text-white/40 italic">Todavía no hay rondas registradas.</p>
          )}
        </div>
      </section>
    </div>
  );
}
