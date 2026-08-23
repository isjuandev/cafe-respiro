"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaFilm, FaPlus, FaCalendarAlt, FaArrowUp } from "react-icons/fa";

type Pelicula = {
  id: string;
  titulo: string;
  tituloNormalizado?: string | null;
  director?: string | null;
  anio?: number | null;
  duracionMin?: number | null;
  sinopsis?: string | null;
  posterUrl?: string | null;
  createdAt: string;
  _count?: { funciones: number };
};

export default function BibliotecaPage() {
  const router = useRouter();
  const [peliculas, setPeliculas] = useState<Pelicula[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ titulo: "", director: "", anio: "", duracionMin: "", sinopsis: "", posterUrl: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Programar función desde pelicula
  const [programarId, setProgramarId] = useState("");
  const [progError, setProgError] = useState<string | null>(null);
  const [progSuccess, setProgSuccess] = useState<string | null>(null);

  async function checkAuth() {
    const res = await fetch("/api/admin/me", { credentials: "include" });
    if (!res.ok) router.push("/admin/login");
    return res.ok;
  }

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/peliculas", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPeliculas(data.peliculas);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth().then((ok) => {
      if (ok) load();
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (form.titulo.trim().length < 2) {
      setFormError("Título mínimo 2 caracteres");
      return;
    }
    try {
      const res = await fetch("/api/admin/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          director: form.director.trim() || undefined,
          anio: form.anio ? Number(form.anio) : undefined,
          duracionMin: form.duracionMin ? Number(form.duracionMin) : undefined,
          sinopsis: form.sinopsis.trim() || undefined,
          posterUrl: form.posterUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (data.duplicada) {
        setFormError(data.aviso || "Película muy similar ya existe");
        return;
      }
      setFormSuccess(`"${data.pelicula.titulo}" agregada a biblioteca`);
      setForm({ titulo: "", director: "", anio: "", duracionMin: "", sinopsis: "", posterUrl: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleProgramar(e: React.FormEvent) {
    e.preventDefault();
    setProgError(null);
    setProgSuccess(null);
    try {
      const fechaHora = (document.getElementById("bib-fecha") as HTMLInputElement)?.value;
      const cupo = Number((document.getElementById("bib-cupo") as HTMLInputElement)?.value);
      if (!programarId || !fechaHora) throw new Error("Elige película y fecha");
      const res = await fetch(`/api/admin/peliculas/${programarId}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fechaHora: new Date(fechaHora).toISOString(), cupoTotal: cupo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setProgSuccess(`Función creada: ${data.funcion.pelicula.titulo} · Ver en cartelera`);
    } catch (err) {
      setProgError(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050507] text-white">
        <aside className="hidden w-[220px] border-r border-white/5 bg-[#0A0A0A] lg:flex" />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-white/5" />
            <div className="h-64 rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050507] text-white -mx-4 -my-8">
      {/* SIDEBAR */}
      <aside className="hidden w-[220px] flex-col border-r border-white/5 bg-[#0A0A0A] lg:flex">
        <div className="flex h-[64px] items-center gap-3 border-b border-white/5 px-5">
          <div className="flex h-8 w-8 items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
              <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[10px] tracking-[0.2em] text-white">CAFÉ</div>
            <div className="text-sm font-bold tracking-[0.12em] text-white">RESPIRO</div>
            <div className="text-[8px] tracking-[0.2em] text-[#E8B86A]">CINE & CAFÉ</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <FaFilm className="text-sm" /> Dashboard
          </Link>
          <Link href="/admin/peliculas" className="flex items-center gap-3 rounded-lg bg-[#E8B86A]/20 px-3 py-2.5 text-sm font-medium text-[#E8B86A]">
            <FaFilm /> Películas
          </Link>
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <FaCalendarAlt /> Funciones
          </Link>
        </nav>
        <div className="border-t border-white/5 p-3">
          <Link href="/admin" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white">
            ← Volver
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1">
        <header className="flex h-[64px] items-center justify-between border-b border-white/5 bg-[#050507] px-6">
          <div>
            <h1 className="text-xl font-bold text-white">Biblioteca</h1>
            <p className="text-xs text-[#E8B86A]">Catálogo para programar funciones</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black hover:bg-[#D4A574]">
            <FaPlus className="text-xs" /> {showForm ? "Cerrar" : "Nueva película"}
          </button>
        </header>

        <div className="p-4 sm:p-6">
          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 grid gap-4 rounded-2xl border border-[#E8B86A]/20 bg-[#141414] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs tracking-wide text-white/60">Título *</label>
                  <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Dune" required className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs tracking-wide text-white/60">Director</label>
                  <input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} placeholder="Villeneuve" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs tracking-wide text-white/60">Año</label>
                  <input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} placeholder="2021" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs tracking-wide text-white/60">Duración (min)</label>
                  <input type="number" value={form.duracionMin} onChange={(e) => setForm({ ...form, duracionMin: e.target.value })} placeholder="155" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs tracking-wide text-white/60">Poster URL</label>
                  <input value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs tracking-wide text-white/60">Sinopsis</label>
                  <textarea value={form.sinopsis} onChange={(e) => setForm({ ...form, sinopsis: e.target.value })} placeholder="Corta sinopsis" rows={2} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
                </div>
              </div>
              {formError && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{formError}</p>}
              {formSuccess && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{formSuccess}</p>}
              <button type="submit" className="w-full rounded-xl bg-[#E8B86A] py-3 text-sm font-bold text-black">
                Guardar en biblioteca
              </button>
              <p className="text-[10px] text-white/20">Sin unique duro: aviso si título muy similar ya existe (mismo normalize que sugerencias).</p>
            </form>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
            <h2 className="text-xs font-bold tracking-[0.15em] text-white">PELÍCULAS EN BIBLIOTECA</h2>
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(peliculas || []).map((p) => (
                <div key={p.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="text-sm font-bold text-white truncate">{p.titulo}</div>
                  <div className="text-xs text-white/40">
                    {p.director || "—"} {p.anio ? `· ${p.anio}` : ""} {p.duracionMin ? `· ${p.duracionMin}min` : ""}
                  </div>
                  <div className="mt-2 text-xs text-white/30">Funciones: {p._count?.funciones ?? 0}</div>
                  <button
                    onClick={() => setProgramarId(p.id)}
                    className="mt-3 w-full rounded-lg border border-[#E8B86A]/20 bg-[#E8B86A]/10 py-1.5 text-xs font-medium text-[#E8B86A] hover:bg-[#E8B86A]/20"
                  >
                    Programar
                  </button>
                </div>
              ))}
              {(!peliculas || peliculas.length === 0) && <p className="text-xs text-white/30">Biblioteca vacía. Crea la primera película.</p>}
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const peliculaId = programarId;
            const fechaHora = (document.getElementById("bib-fecha2") as HTMLInputElement)?.value;
            const cupo = Number((document.getElementById("bib-cupo2") as HTMLInputElement)?.value);
            if (!peliculaId || !fechaHora) return;
            try {
              setProgError(null); setProgSuccess(null);
              const res = await fetch(`/api/admin/peliculas/${peliculaId}/funciones`, {
                method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                body: JSON.stringify({ fechaHora: new Date(fechaHora).toISOString(), cupoTotal: cupo }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Error");
              setProgSuccess(`Función programada: ${data.funcion.pelicula.titulo}`);
            } catch (err) {
              setProgError(err instanceof Error ? err.message : "Error");
            }
          }} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-white/60">Película</label>
              <select value={programarId} onChange={(e) => setProgramarId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white" required>
                <option value="">— Elige de biblioteca —</option>
                {(peliculas || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60">Fecha y hora</label>
              <input id="bib-fecha2" type="datetime-local" required className="mt-1 rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60">Cupo</label>
              <input id="bib-cupo2" type="number" defaultValue={30} min={1} max={200} className="mt-1 w-20 rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white" />
            </div>
            <button type="submit" className="rounded-xl bg-[#E8B86A] px-6 py-3 text-sm font-bold text-black">Programar</button>
          </form>
          {progError && <p className="mt-2 text-xs text-red-300">{progError}</p>}
          {progSuccess && <p className="mt-2 text-xs text-green-300">{progSuccess} · Ver en cartelera</p>}
        </div>
      </div>
    </div>
  );
}
