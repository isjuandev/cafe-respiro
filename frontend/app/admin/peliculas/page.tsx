"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaFilm,
  FaCalendarPlus,
  FaClock,
  FaUserTie,
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaThLarge,
  FaList,
} from "react-icons/fa";

interface Pelicula {
  id: string;
  titulo: string;
  tituloNormalizado?: string | null;
  director?: string | null;
  genero?: string | null;
  anio?: number | null;
  duracionMin?: number | null;
  sinopsis?: string | null;
  posterUrl?: string | null;
  createdAt: string;
  _count?: { funciones: number };
}

interface TmdbResult {
  id: number;
  titulo: string;
  originalTitulo?: string;
  anio?: number | null;
  sinopsis?: string | null;
  posterUrl?: string | null;
}

export default function PeliculasAdminPage() {
  const router = useRouter();
  const [peliculas, setPeliculas] = useState<Pelicula[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vista: cards compactas o lista detallada
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtros de búsqueda local
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGenero, setFilterGenero] = useState("todos");

  // Modal para agregar nueva película
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    director: "",
    genero: "",
    anio: "",
    duracionMin: "",
    sinopsis: "",
    posterUrl: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Búsqueda en TMDB
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  // Modal de programación rápida
  const [selectedMovieForProgram, setSelectedMovieForProgram] = useState<Pelicula | null>(null);
  const [programFecha, setProgramFecha] = useState("");
  const [programCupos, setProgramCupos] = useState(16);
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const [programSuccess, setProgramSuccess] = useState<string | null>(null);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (!res.ok) {
        router.push("/admin/login");
        return false;
      }
      return true;
    } catch {
      router.push("/admin/login");
      return false;
    }
  }

  async function loadPeliculas() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/peliculas", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPeliculas(data.peliculas || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar películas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth().then((ok) => {
      if (ok) loadPeliculas();
    });
  }, []);

  // Lista única de géneros para el filtro
  const generosDisponibles = useMemo(() => {
    if (!peliculas) return [];
    const set = new Set<string>();
    peliculas.forEach((p) => {
      if (p.genero) {
        p.genero.split("/").forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [peliculas]);

  // Filtrar películas en tiempo real
  const filteredPeliculas = useMemo(() => {
    if (!peliculas) return [];
    return peliculas.filter((p) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.director && p.director.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.genero && p.genero.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchGenre =
        filterGenero === "todos" ||
        (p.genero && p.genero.toLowerCase().includes(filterGenero.toLowerCase()));

      return matchSearch && matchGenre;
    });
  }, [peliculas, searchTerm, filterGenero]);

  async function searchTmdb() {
    if (!tmdbQuery.trim() || tmdbQuery.trim().length < 2) return;
    try {
      setTmdbLoading(true);
      const res = await fetch(
        `/api/peliculas/buscar-externa?q=${encodeURIComponent(tmdbQuery.trim())}`
      );
      const data = await res.json();
      setTmdbResults(data.results || []);
    } catch {
      setTmdbResults([]);
    } finally {
      setTmdbLoading(false);
    }
  }

  function autofillFromTmdb(movie: TmdbResult) {
    setForm((prev) => ({
      ...prev,
      titulo: movie.titulo || prev.titulo,
      anio: movie.anio ? String(movie.anio) : prev.anio,
      sinopsis: movie.sinopsis || prev.sinopsis,
      posterUrl: movie.posterUrl || prev.posterUrl,
    }));
    setTmdbResults([]);
    setTmdbQuery("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (form.titulo.trim().length < 2) {
      setFormError("El título debe tener al menos 2 caracteres");
      return;
    }
    try {
      setFormSubmitting(true);
      const res = await fetch("/api/admin/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          director: form.director.trim() || undefined,
          genero: form.genero.trim() || undefined,
          anio: form.anio ? Number(form.anio) : undefined,
          duracionMin: form.duracionMin ? Number(form.duracionMin) : undefined,
          sinopsis: form.sinopsis.trim() || undefined,
          posterUrl: form.posterUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear película");
      if (data.duplicada) {
        setFormError(data.aviso || "Una película similar ya existe en el catálogo");
        return;
      }

      setFormSuccess(`"${data.pelicula.titulo}" agregada exitosamente`);
      setForm({
        titulo: "",
        director: "",
        genero: "",
        anio: "",
        duracionMin: "",
        sinopsis: "",
        posterUrl: "",
      });
      setShowAddModal(false);
      await loadPeliculas();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleProgramar(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMovieForProgram || !programFecha) return;
    setProgramError(null);
    setProgramSuccess(null);

    try {
      setProgramLoading(true);
      const res = await fetch(`/api/admin/peliculas/${selectedMovieForProgram.id}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fechaHora: new Date(`${programFecha}T19:00:00`).toISOString(),
          cupoTotal: programCupos,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al programar función");

      setProgramSuccess(`Función de "${selectedMovieForProgram.titulo}" programada a las 7:00 PM`);
      setSelectedMovieForProgram(null);
      await loadPeliculas();
    } catch (err) {
      setProgramError(err instanceof Error ? err.message : "Error al programar");
    } finally {
      setProgramLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Encabezado y Estadísticas */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FaFilm className="text-[#E8B86A]" /> Catálogo de Películas
          </h2>
          <p className="mt-0.5 text-xs text-white/60">
            Biblioteca curada para programar las proyecciones en Café Respiro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 border border-white/5">
            <span className="text-[#E8B86A] font-bold">{peliculas?.length || 0}</span> títulos
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8B86A] px-4 py-2 text-xs font-bold text-black hover:bg-[#D4A574] transition-colors"
          >
            <FaPlus className="text-[10px]" /> Nueva Película
          </button>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Selector de Vista */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141414] p-3">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, director o género..."
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-[#E8B86A]/50 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterGenero}
            onChange={(e) => setFilterGenero(e.target.value)}
            className="control-dark rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
          >
            <option value="todos">Todos los géneros</option>
            {generosDisponibles.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-[#E8B86A] text-black font-bold"
                  : "text-white/60 hover:text-white"
              }`}
              title="Vista en Cards"
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-[#E8B86A] text-black font-bold"
                  : "text-white/60 hover:text-white"
              }`}
              title="Vista en Lista"
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {programSuccess && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-300">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-sm shrink-0" />
            <span>{programSuccess}</span>
          </div>
          <button onClick={() => setProgramSuccess(null)} className="font-bold hover:text-white">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Grid o Lista de Películas */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredPeliculas.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <FaFilm className="mx-auto text-3xl text-white/20 mb-2" />
          <h4 className="text-xs font-bold text-white">No se encontraron películas</h4>
          <p className="mt-1 text-[11px] text-white/40">
            {searchTerm || filterGenero !== "todos"
              ? "Prueba cambiando los filtros o el término de búsqueda."
              : "La biblioteca está vacía. Agrega tu primer título con el botón superior."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID DE CARDS COMPACTAS Y ELEGANTES */
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredPeliculas.map((p) => {
            const posterSrc =
              p.posterUrl ||
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop";
            const funcionesCount = p._count?.funciones ?? 0;

            return (
              <div
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111114] transition-colors hover:border-white/25"
              >
                {/* Póster Compacto */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/50">
                  <img
                    src={posterSrc}
                    alt={p.titulo}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-black/20" />

                  {/* Badges superiores sobre el póster */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                    {p.anio && (
                      <span className="rounded bg-black/90 px-1.5 py-0.5 text-[9px] font-bold text-white border border-white/10">
                        {p.anio}
                      </span>
                    )}
                    {p.duracionMin && (
                      <span className="rounded bg-black/90 px-1.5 py-0.5 text-[9px] font-bold text-[#E8B86A] border border-white/10">
                        {p.duracionMin}m
                      </span>
                    )}
                  </div>

                  {/* Badge de funciones programadas */}
                  <div className="absolute bottom-2 left-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        funcionesCount > 0
                          ? "bg-green-600/80 text-white"
                          : "bg-black/80 text-white/50 border border-white/10"
                      }`}
                    >
                      {funcionesCount > 0 ? `${funcionesCount} func.` : "Sin programar"}
                    </span>
                  </div>
                </div>

                {/* Contenido Compacto */}
                <div className="flex flex-1 flex-col justify-between p-3 space-y-2">
                  <div>
                    <h3
                      className="text-xs font-bold text-white tracking-tight line-clamp-1 group-hover:text-[#E8B86A] transition-colors"
                      title={p.titulo}
                    >
                      {p.titulo}
                    </h3>
                    <p
                      className="mt-0.5 text-[11px] text-white/50 truncate"
                      title={p.director || p.genero || ""}
                    >
                      {p.director || p.genero || "Cine de autor"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMovieForProgram(p);
                      setProgramFecha(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
                      setProgramCupos(16);
                      setProgramError(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 py-1.5 text-[11px] font-bold text-white hover:bg-[#E8B86A] hover:text-black hover:border-[#E8B86A] transition-colors"
                  >
                    <FaCalendarPlus className="text-[10px]" /> Programar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DE LISTA / TABLA DETALLADA */
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
          <div className="divide-y divide-white/5">
            {filteredPeliculas.map((p) => {
              const posterSrc =
                p.posterUrl ||
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=300&fit=crop";
              const funcionesCount = p._count?.funciones ?? 0;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-4 p-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={posterSrc}
                      alt={p.titulo}
                      className="h-14 w-10 object-cover rounded border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white truncate">{p.titulo}</h3>
                        {p.anio && (
                          <span className="text-[10px] text-white/40">({p.anio})</span>
                        )}
                        {p.genero && (
                          <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-[9px] text-[#E8B86A]">
                            {p.genero}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/50 truncate">
                        {p.director ? `Dir: ${p.director}` : ""} {p.duracionMin ? `· ${p.duracionMin} min` : ""}
                      </p>
                      {p.sinopsis && (
                        <p className="mt-0.5 text-[10px] text-white/40 line-clamp-1">
                          {p.sinopsis}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`text-[11px] font-semibold ${
                        funcionesCount > 0 ? "text-white" : "text-white/40"
                      }`}
                    >
                      {funcionesCount > 0
                        ? `${funcionesCount} ${funcionesCount === 1 ? "función" : "funciones"}`
                        : "Sin programar"}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedMovieForProgram(p);
                        setProgramFecha(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
                        setProgramCupos(16);
                        setProgramError(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8B86A]/10 border border-[#E8B86A]/30 px-3 py-1.5 text-xs font-bold text-[#E8B86A] hover:bg-[#E8B86A] hover:text-black transition-colors"
                    >
                      <FaCalendarPlus className="text-[10px]" /> Programar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Programar Función Rápida */}
      {selectedMovieForProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85"
            onClick={() => !programLoading && setSelectedMovieForProgram(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111114] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaCalendarPlus className="text-[#E8B86A]" /> Programar en Cartelera
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMovieForProgram(null)}
                className="text-white/40 hover:text-white text-xs"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-3 flex gap-3 items-center bg-[#16161A] p-2.5 rounded-xl border border-white/5">
              <img
                src={
                  selectedMovieForProgram.posterUrl ||
                  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=300&fit=crop"
                }
                alt={selectedMovieForProgram.titulo}
                className="h-14 w-10 object-cover rounded-lg shrink-0 border border-white/10"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedMovieForProgram.titulo}
                </h4>
                <p className="text-[11px] text-white/50">
                  {selectedMovieForProgram.director || "Director no especificado"} ·{" "}
                  {selectedMovieForProgram.duracionMin
                    ? `${selectedMovieForProgram.duracionMin} min`
                    : ""}
                </p>
              </div>
            </div>

            <form onSubmit={handleProgramar} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-white/70">
                  Fecha de Función *
                </label>
                <input
                  type="date"
                  required
                  value={programFecha}
                  onChange={(e) => setProgramFecha(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="control-dark mt-1 w-full rounded-xl px-3 py-2 text-xs text-white focus:border-[#E8B86A] focus:outline-none"
                />
                <span className="text-[10px] text-[#E8B86A] mt-1 block">
                  ● Horario fijo: 7:00 PM (19:00 Hora Colombia)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70">
                  Cupo de la Sala (Máx. 16) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  required
                  value={programCupos}
                  onChange={(e) => setProgramCupos(parseInt(e.target.value, 10) || 16)}
                  className="control-dark mt-1 w-full rounded-xl px-3 py-2 text-xs text-white focus:border-[#E8B86A] focus:outline-none"
                />
              </div>

              {programError && (
                <div className="rounded-lg bg-red-500/10 p-2.5 text-xs text-red-300 border border-red-500/20">
                  {programError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMovieForProgram(null)}
                  className="flex-1 rounded-xl border border-white/10 py-2 text-xs font-bold text-white hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={programLoading}
                  className="flex-1 rounded-xl bg-[#E8B86A] py-2 text-xs font-bold text-black hover:bg-[#D4A574] disabled:opacity-50"
                >
                  {programLoading ? "Programando..." : "Confirmar Función"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Nueva Película con Autocompletado TMDB */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111114] p-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaPlus className="text-[#E8B86A] text-xs" /> Agregar Película al Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            {/* Buscador TMDB */}
            <div className="mt-3 rounded-xl border border-white/10 bg-[#0A0A0A] p-3">
              <label className="block text-[10px] font-bold tracking-wider text-[#E8B86A]">
                AUTOCOMPLETAR METADATOS Y PÓSTER (TMDB)
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchTmdb();
                    }
                  }}
                  placeholder="Escribe el título de la película (ej: Perfect Days, Dune)..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={searchTmdb}
                  disabled={tmdbLoading || !tmdbQuery.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8B86A]/10 border border-[#E8B86A]/30 px-3 py-1.5 text-xs font-bold text-[#E8B86A] hover:bg-[#E8B86A]/20 disabled:opacity-40 transition-colors"
                >
                  <FaSearch className="text-[10px]" /> {tmdbLoading ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {tmdbResults.length > 0 && (
                <div className="mt-2 divide-y divide-white/5 rounded-lg border border-white/10 bg-[#141414] max-h-40 overflow-y-auto">
                  {tmdbResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => autofillFromTmdb(r)}
                      className="flex w-full items-center justify-between p-2 text-left text-xs hover:bg-white/5 text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {r.posterUrl && (
                          <img
                            src={r.posterUrl}
                            alt=""
                            className="h-8 w-6 object-cover rounded"
                          />
                        )}
                        <div>
                          <span className="font-semibold">{r.titulo}</span>
                          {r.anio && <span className="text-white/40 ml-1.5">({r.anio})</span>}
                        </div>
                      </div>
                      <span className="text-[#E8B86A] text-[10px] font-bold">Usar datos →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-white/70">Título *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Perfect Days"
                  required
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-white/70">Director</label>
                <input
                  value={form.director}
                  onChange={(e) => setForm({ ...form, director: e.target.value })}
                  placeholder="Ej: Wim Wenders"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-white/70">Género</label>
                <input
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value })}
                  placeholder="Ej: Drama, Romance"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-white/70">Año</label>
                <input
                  type="number"
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: e.target.value })}
                  placeholder="2023"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-white/70">Duración (minutos)</label>
                <input
                  type="number"
                  value={form.duracionMin}
                  onChange={(e) => setForm({ ...form, duracionMin: e.target.value })}
                  placeholder="123"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-white/70">
                  URL del Póster (TMDB o Web)
                </label>
                <input
                  value={form.posterUrl}
                  onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-white/70">Sinopsis</label>
                <textarea
                  value={form.sinopsis}
                  onChange={(e) => setForm({ ...form, sinopsis: e.target.value })}
                  placeholder="Reseña breve de la película..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-white focus:border-[#E8B86A]/50 focus:outline-none"
                />
              </div>

              {formError && (
                <p className="sm:col-span-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300 border border-amber-500/20">
                  {formError}
                </p>
              )}

              {formSuccess && (
                <p className="sm:col-span-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300 border border-green-500/20">
                  {formSuccess}
                </p>
              )}

              <div className="sm:col-span-2 mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 rounded-xl bg-[#E8B86A] py-2.5 text-xs font-bold text-black hover:bg-[#D4A574] disabled:opacity-50"
                >
                  {formSubmitting ? "Guardando..." : "Guardar en Catálogo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
