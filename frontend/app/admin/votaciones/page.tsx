"use client";

import { useEffect, useState } from "react";

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
          <h2 className="text-2xl font-bold text-white">Votaciones</h2>
          <p className="mt-1 text-sm text-white/60">
            Crea rondas participativas y consulta los resultados deterministas.
          </p>
        </div>

        {active && (
          <button
            onClick={closeVoting}
            disabled={busy}
            className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-bold text-red-300 border border-red-500/20 hover:bg-red-500/25 disabled:opacity-40"
          >
            {busy ? "Procesando..." : "Cerrar votación activa"}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 border border-red-500/20"
        >
          <span>{error}</span>
          <button onClick={loadData} className="ml-3 underline text-xs font-bold hover:text-white">
            Reintentar
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-300 border border-green-500/20"
        >
          {message}
        </p>
      )}

      {!active && (
        <section className="surface-card space-y-4 p-5">
          <div>
            <h3 className="text-base font-bold text-white">Nueva Ronda de Votación</h3>
            <p className="mt-1 text-sm text-white/50">
              Selecciona las películas sugeridas que competirán. El cierre ocurrirá a las 6:00 PM de la fecha elegida.
            </p>
          </div>

          <label className="block max-w-xs text-xs font-bold tracking-wider text-white/70">
            FECHA DE CIERRE (6:00 PM)
            <input
              type="date"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-bold tracking-wider text-white/60">
              PELÍCULAS PENDIENTES DISPONIBLES ({available.length})
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {available.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                    selected.includes(item.id)
                      ? "border-[#E8B86A] bg-[#E8B86A]/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
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
                    className="rounded border-white/20 text-[#E8B86A] focus:ring-0"
                  />
                  <span className="truncate font-medium">{item.titulo}</span>
                  <span className="ml-auto shrink-0 font-bold text-[#E8B86A]">
                    {item._count.votos} votos
                  </span>
                </label>
              ))}
              {!available.length && (
                <p className="col-span-full py-4 text-center text-sm text-white/40">
                  No hay sugerencias pendientes disponibles para iniciar una ronda.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={createVoting}
            disabled={busy || !selected.length}
            className="rounded-lg bg-[#E8B86A] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#D4A574] disabled:opacity-40"
          >
            {busy ? "Creando..." : `Crear ronda con ${selected.length} películas`}
          </button>
        </section>
      )}

      {active && (
        <section className="surface-card p-5 border border-[#E8B86A]/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <span className="rounded-full bg-[#E8B86A]/20 px-2.5 py-0.5 text-xs font-bold text-[#E8B86A]">
                RONDA EN CURSO
              </span>
              <p className="mt-2 text-sm text-white/70">
                Cierra el{" "}
                <strong className="text-white">
                  {new Date(active.cierraAt).toLocaleString("es-CO", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </strong>
              </p>
            </div>
            <span className="text-sm font-medium text-[#E8B86A]">
              {active.sugerencias.length} películas compitiendo
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.sugerencias.map((sug) => (
              <div
                key={sug.id}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 border border-white/5"
              >
                <span className="truncate text-sm font-medium text-white">{sug.titulo}</span>
                <span className="ml-2 font-bold text-[#E8B86A]">
                  {sug._count?.votos || 0} votos
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card p-5">
        <h3 className="mb-4 text-sm font-bold tracking-wider text-white">HISTORIAL DE RONDAS</h3>
        <div className="space-y-3">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      round.estado === "ACTIVA"
                        ? "bg-[#E8B86A]/20 text-[#E8B86A]"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {round.estado}
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(round.cierraAt).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {round.ganadora && (
                  <p className="mt-2 text-sm font-bold text-white">
                    Ganadora: <span className="text-[#E8B86A]">{round.ganadora.titulo}</span>
                  </p>
                )}
              </div>
              <span className="text-xs text-white/40">
                {round.sugerencias?.length || 0} películas participantes
              </span>
            </div>
          ))}
          {!rounds.length && (
            <p className="py-4 text-center text-sm text-white/40">Todavía no hay rondas registradas.</p>
          )}
        </div>
      </section>
    </div>
  );
}
