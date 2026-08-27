"use client";

import { useEffect, useState } from "react";
import { FaFilm, FaLightbulb, FaTicketAlt, FaUsers, FaChartBar } from "react-icons/fa";

type Suggestion = { id: string; titulo: string; estado: string; _count: { votos: number } };
type Function = { id: string; fechaHora: string; cupoTotal: number; cuposOcupados?: number; cuposDisponibles?: number; pelicula: { titulo: string } };

export default function AdminDashboardPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [movies, setMovies] = useState<unknown[]>([]);
  const [reservas, setReservas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, fRes, pRes] = await Promise.all([fetch("/api/admin/sugerencias", { credentials: "include" }), fetch("/api/funciones"), fetch("/api/admin/peliculas", { credentials: "include" })]);
        if (!sRes.ok || !fRes.ok || !pRes.ok) throw new Error("No se pudieron cargar las métricas");
        const [sData, fData, pData] = await Promise.all([sRes.json(), fRes.json(), pRes.json()]);
        setSuggestions(sData.sugerencias || []); setFunctions(fData.funciones || []); setMovies(pData.peliculas || []);
        if (fData.funciones?.[0]) { const rRes = await fetch(`/api/admin/funciones/${fData.funciones[0].id}/reservas`, { credentials: "include" }); if (rRes.ok) { const rData = await rRes.json(); setReservas(rData.totalReservas || rData.reservas?.length || 0); } }
      } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar las métricas"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="space-y-4"><div className="h-24 animate-pulse rounded-xl bg-white/5" /><div className="h-64 animate-pulse rounded-xl bg-white/5" /></div>;
  if (error) return <div className="rounded-xl bg-red-500/10 p-6 text-red-300" role="alert">{error}</div>;
  const pending = suggestions.filter((item) => item.estado === "PENDIENTE").length;
  const maxVotes = Math.max(...suggestions.map((item) => item._count?.votos || 0), 1);
  const current = functions[0];
  const stats = [{ label: "Reservas", value: reservas, icon: FaTicketAlt }, { label: "Cupos libres", value: current?.cuposDisponibles ?? 0, icon: FaUsers }, { label: "Películas", value: movies.length, icon: FaFilm }, { label: "Votos", value: suggestions.reduce((total, item) => total + (item._count?.votos || 0), 0), icon: FaChartBar }, { label: "Sugerencias pendientes", value: pending, icon: FaLightbulb }];
  return <div className="space-y-6"><div><h2 className="text-2xl font-bold text-white">Dashboard</h2><p className="mt-1 text-sm text-white/60">Resumen operativo de Café Respiro.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-white/10 bg-[#141414] p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8B86A]/15 text-[#E8B86A]"><Icon /></div><span className="text-xs text-white/60">{label}</span></div><p className="mt-4 text-2xl font-bold text-white">{value}</p></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-white/10 bg-[#141414] p-5"><h2 className="text-xs font-bold tracking-[0.15em] text-white">VOTOS POR SUGERENCIA</h2><div className="mt-5 space-y-4">{suggestions.slice(0, 6).map((item) => <div key={item.id}><div className="flex justify-between text-xs"><span className="truncate text-white/70">{item.titulo}</span><span className="text-[#E8B86A]">{item._count?.votos || 0}</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-[#E8B86A]" style={{ width: `${Math.max(4, ((item._count?.votos || 0) / maxVotes) * 100)}%` }} /></div></div>)}{!suggestions.length && <p className="text-sm text-white/40">Aún no hay datos de votación.</p>}</div></section><section className="rounded-xl border border-white/10 bg-[#141414] p-5"><h2 className="text-xs font-bold tracking-[0.15em] text-white">PRÓXIMAS FUNCIONES</h2><div className="mt-5 space-y-3">{functions.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{item.pelicula.titulo}</p><p className="text-xs text-white/50">{new Date(item.fechaHora).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="shrink-0 text-xs text-[#E8B86A]">{item.cuposDisponibles ?? 0}/{item.cupoTotal}</span></div>)}{!functions.length && <p className="text-sm text-white/40">No hay funciones programadas.</p>}</div></section></div></div>;
}
