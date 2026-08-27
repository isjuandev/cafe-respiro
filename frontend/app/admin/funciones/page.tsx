"use client";

import { FormEvent, useEffect, useState } from "react";

type Movie = { id: string; titulo: string };
type Show = { id: string; fechaHora: string; cupoTotal: number; cuposOcupados?: number; cuposDisponibles?: number; pelicula: Movie };

export default function AdminFunctionsPage() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [movieId, setMovieId] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("15");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const [showsRes, moviesRes] = await Promise.all([fetch("/api/funciones"), fetch("/api/admin/peliculas", { credentials: "include" })]);
      if (!showsRes.ok || !moviesRes.ok) throw new Error("No se pudieron cargar las funciones");
      const [showsData, moviesData] = await Promise.all([showsRes.json(), moviesRes.json()]);
      setShows(showsData.funciones || []);
      setMovies(moviesData.peliculas || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
  }

  useEffect(() => { load(); }, []);

  const ocupadas = new Set((shows || []).map((s) => new Date(s.fechaHora).toISOString().split("T")[0]));
  const fechaOcupada = date ? ocupadas.has(date) : false;
  const cupoNum = Number(capacity);
  const cupoInvalido = Number.isNaN(cupoNum) || cupoNum < 1 || cupoNum > 15;

  async function create(e: FormEvent) {
    e.preventDefault();
    if (fechaOcupada) { setError("Ya hay una función ese día — sala única, máximo 1 por día."); return; }
    if (cupoInvalido) { setError("Cupos debe ser 1-15 (sala única)."); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      const res = await fetch(`/api/admin/peliculas/${movieId}/funciones`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ fechaHora: new Date(`${date}T19:00:00`).toISOString(), cupoTotal: cupoNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo crear la función");
      setMessage(`Función creada: ${data.funcion.pelicula.titulo} a las 7:00 PM`);
      setDate(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  if (shows === null && !error) return <div className="h-64 animate-pulse rounded-xl bg-white/5" />;
  return <div className="space-y-6">
    <div><h2 className="text-2xl font-bold">Funciones</h2><p className="mt-1 text-sm text-white/60">Programa y consulta las próximas proyecciones. Todas comienzan a las 7:00 PM.</p></div>
    {error && <div role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}<button onClick={load} className="ml-3 underline">Reintentar</button></div>}
    {message && <p role="status" className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-300">{message}</p>}
    <form onSubmit={create} className="surface-card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
      <div><label htmlFor="function-movie" className="text-xs text-white/60">Película</label><select id="function-movie" value={movieId} onChange={(e) => setMovieId(e.target.value)} className="control-dark mt-1 w-full px-3 py-2 text-sm" required><option value="">Selecciona</option>{movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.titulo}</option>)}</select></div>
      <div><label htmlFor="function-date" className="text-xs text-white/60">Fecha (7:00 PM) — 1 por día</label><input id="function-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`control-dark mt-1 w-full px-3 py-2 text-sm ${fechaOcupada ? "border-red-500/50" : ""}`} required />{fechaOcupada && <p className="mt-1 text-xs text-red-300">Ese día ya está ocupado</p>}</div>
      <div><label htmlFor="function-capacity" className="text-xs text-white/60">Cupos (máx 15)</label><input id="function-capacity" type="number" min="1" max={15} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={`control-dark mt-1 w-full px-3 py-2 text-sm ${cupoInvalido && capacity !== "" ? "border-red-500/50" : ""}`} required />{cupoInvalido && capacity !== "" && <p className="mt-1 text-xs text-red-300">1-15</p>}</div>
      <button disabled={saving || fechaOcupada || cupoInvalido} className="rounded-lg bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{saving ? "Guardando..." : "Programar"}</button>
    </form>
    <section className="space-y-3">{shows?.map((show) => <article key={show.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"><div><h3 className="font-medium">{show.pelicula.titulo}</h3><p className="mt-1 text-sm text-white/60">{new Date(show.fechaHora).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="text-sm text-[#E8B86A]">{show.cuposDisponibles ?? 0}/{show.cupoTotal} cupos</span></article>)}{!shows?.length && <p className="surface-card p-6 text-center text-sm text-white/50">No hay funciones programadas.</p>}</section>
  </div>;
}
