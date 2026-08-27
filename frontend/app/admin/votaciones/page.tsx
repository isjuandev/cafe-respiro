"use client";

import { useEffect, useState } from "react";

type Suggestion = { id: string; titulo: string; estado: string; votacionId?: string | null; _count: { votos: number } };
type Round = { id: string; estado: string; cierraAt: string; ganadora?: { titulo: string } | null; sugerencias: Suggestion[] };

const defaultCloseAt = () => {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  date.setSeconds(0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function AdminVotingPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [closeAt, setCloseAt] = useState(defaultCloseAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [suggestionsRes, roundsRes] = await Promise.all([
        fetch("/api/admin/sugerencias", { credentials: "include" }),
        fetch("/api/admin/votaciones", { credentials: "include" }),
      ]);
      if (!suggestionsRes.ok || !roundsRes.ok) throw new Error("No se pudo cargar las votaciones");
      setItems((await suggestionsRes.json()).sugerencias || []);
      setRounds(await roundsRes.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
  }

  useEffect(() => { load(); }, []);

  async function createVoting() {
    setBusy(true); setError(null); setMessage(null);
    try {
      const res = await fetch("/api/admin/votaciones", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cierraAt: new Date(`${closeAt}T18:00:00`).toISOString(), sugerenciaIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo crear la votación");
      setMessage("Ronda de votación creada correctamente"); setSelected([]); setCloseAt(defaultCloseAt()); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  async function closeVoting() {
    if (!window.confirm("¿Cerrar la votación activa?")) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/admin/votaciones/cerrar", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cerrar");
      setMessage(data.ganadoraId ? "Votación cerrada. Ya puedes programar la ganadora." : "Votación cerrada sin votos"); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  const active = rounds.find((round) => round.estado === "ACTIVA");
  const available = items.filter((item) => item.estado === "PENDIENTE" && !item.votacionId);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-bold">Votaciones</h2><p className="mt-1 text-sm text-white/60">Crea rondas con fecha de cierre y consulta sus resultados.</p></div>
      <button onClick={closeVoting} disabled={busy || !active} className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-300 disabled:opacity-40">{busy ? "Procesando..." : "Cerrar votación"}</button>
    </div>
    {error && <div role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}<button onClick={load} className="ml-3 underline">Reintentar</button></div>}
    {message && <p role="status" className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-300">{message}</p>}
    {!active && <section className="surface-card space-y-4 p-5"><div><h3 className="font-semibold">Nueva ronda</h3><p className="mt-1 text-sm text-white/50">Selecciona las películas y define la fecha. La votación cerrará automáticamente a las 6:00 PM.</p></div><label className="block max-w-xs text-sm text-white/70">Fecha de cierre (6:00 PM)<input type="date" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" /></label><div className="grid gap-2 sm:grid-cols-2">{available.map((item) => <label key={item.id} className="flex items-center gap-3 rounded-lg border border-white/10 p-3 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />{item.titulo}<span className="ml-auto text-[#E8B86A]">{item._count.votos} votos</span></label>)}{!available.length && <p className="text-sm text-white/50">No hay sugerencias pendientes disponibles.</p>}</div><button onClick={createVoting} disabled={busy || !selected.length} className="rounded-lg bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black disabled:opacity-40">Crear ronda</button></section>}
    {active && <section className="surface-card p-5"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">Ronda activa</h3><p className="text-sm text-white/50">Cierra el {new Date(active.cierraAt).toLocaleString("es-CO")}</p></div><span className="text-sm text-[#E8B86A]">{active.sugerencias.length} películas</span></div></section>}
    <section className="surface-card p-5"><h3 className="mb-4 font-semibold">Historial</h3><div className="space-y-4">{rounds.map((round) => <div key={round.id} className="rounded-lg border border-white/10 p-4"><div className="flex justify-between gap-4 text-sm"><span>{round.estado === "ACTIVA" ? "Activa" : "Cerrada"}</span><span className="text-white/50">{new Date(round.cierraAt).toLocaleString("es-CO")}</span></div>{round.ganadora && <p className="mt-2 text-sm text-[#E8B86A]">Ganadora: {round.ganadora.titulo}</p>}</div>)}{!rounds.length && <p className="text-sm text-white/50">Todavía no hay rondas.</p>}</div></section>
  </div>;
}
