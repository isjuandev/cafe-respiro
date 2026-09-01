"use client";

import { FormEvent, useEffect, useState } from "react";
import { FaCalendarAlt, FaPlus, FaUsers, FaClock } from "react-icons/fa";

interface Movie {
  id: string;
  titulo: string;
}

interface Show {
  id: string;
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados?: number;
  cuposDisponibles?: number;
  pelicula: Movie;
}

export default function AdminFunctionsPage() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [movieId, setMovieId] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("16");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setError(null);
      const [showsRes, moviesRes] = await Promise.all([
        fetch("/api/funciones"),
        fetch("/api/admin/peliculas", { credentials: "include" }),
      ]);

      if (!showsRes.ok || !moviesRes.ok) {
        throw new Error("No se pudieron cargar las funciones y películas");
      }

      const [showsData, moviesData] = await Promise.all([
        showsRes.json(),
        moviesRes.json(),
      ]);

      setShows(showsData.funciones || []);
      setMovies(moviesData.peliculas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const ocupadas = new Set(
    (shows || []).map((s) => new Date(s.fechaHora).toISOString().split("T")[0])
  );
  const fechaOcupada = date ? ocupadas.has(date) : false;
  const cupoNum = Number(capacity);
  const cupoInvalido = Number.isNaN(cupoNum) || cupoNum < 1 || cupoNum > 16;

  async function createFunction(e: FormEvent) {
    e.preventDefault();
    if (!movieId) {
      setError("Selecciona una película");
      return;
    }
    if (fechaOcupada) {
      setError("Ya hay una función programada para ese día (sala única: máximo 1 por día)");
      return;
    }
    if (cupoInvalido) {
      setError("El cupo total debe estar entre 1 y 16 personas");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/peliculas/${movieId}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fechaHora: new Date(`${date}T19:00:00`).toISOString(),
          cupoTotal: cupoNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudo crear la función");
      }

      setMessage(`Función programada exitosamente: ${data.funcion.pelicula.titulo} a las 7:00 PM`);
      setDate("");
      setMovieId("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al programar función");
    } finally {
      setSaving(false);
    }
  }

  if (shows === null && !error) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white/5" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white font-serif">Programación de Funciones</h2>
        <p className="mt-1 text-xs text-white/60">
          Programa las proyecciones de la sala boutique (16 puestos). Hora fija de proyección: 7:00 PM.
        </p>
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

      {/* Formulario de Nueva Función */}
      <form
        onSubmit={createFunction}
        className="rounded-3xl border border-white/10 bg-[#111114] grid gap-4 p-5 sm:p-6 sm:grid-cols-[1.5fr_1fr_120px_auto] sm:items-end"
      >
        <div>
          <label htmlFor="function-movie" className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Película de Biblioteca
          </label>
          <select
            id="function-movie"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs font-medium text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
            required
          >
            <option value="">— Seleccionar película —</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.titulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="function-date" className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Fecha (7:00 PM Fijo)
          </label>
          <input
            id="function-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-2 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors ${
              fechaOcupada ? "border-red-500/50 bg-red-500/10" : ""
            }`}
            required
          />
          {fechaOcupada && (
            <p className="mt-1 text-[10px] text-red-300">Ya existe función en esta fecha</p>
          )}
        </div>

        <div>
          <label htmlFor="function-capacity" className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Aforo (Máx 16)
          </label>
          <input
            id="function-capacity"
            type="number"
            min="1"
            max="16"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={`mt-2 w-full rounded-xl border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-xs text-white focus:border-[#E8B86A] focus:outline-none transition-colors ${
              cupoInvalido && capacity !== "" ? "border-red-500/50" : ""
            }`}
            required
          />
        </div>

        <button
          disabled={saving || fechaOcupada || cupoInvalido || !movieId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E8B86A] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D4A574] transition-colors disabled:opacity-40"
        >
          <FaPlus className="text-[10px]" />
          {saving ? "Guardando..." : "Programar"}
        </button>
      </form>

      {/* Cartelera Programada */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Cartelera Programada</h3>
        {shows?.map((show) => (
          <article
            key={show.id}
            className="rounded-2xl border border-white/10 bg-[#111114] flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 transition-colors hover:border-white/20"
          >
            <div>
              <h4 className="font-bold text-white font-serif text-base">{show.pelicula.titulo}</h4>
              <p className="mt-0.5 text-xs text-white/60 flex items-center gap-2">
                <FaCalendarAlt className="text-[#E8B86A] text-[10px]" />
                {new Date(show.fechaHora).toLocaleString("es-CO", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[#E8B86A]/10 border border-[#E8B86A]/20 px-3 py-1.5 text-xs font-bold text-[#E8B86A] flex items-center gap-1.5">
                <FaUsers className="text-[10px]" />
                {show.cuposDisponibles ?? 0} disp. / {show.cupoTotal} puestos
              </span>
            </div>
          </article>
        ))}
        {!shows?.length && (
          <p className="rounded-2xl border border-white/10 bg-[#111114] p-8 text-center text-xs text-white/40 italic">
            No hay funciones programadas en este momento.
          </p>
        )}
      </section>
    </div>
  );
}
