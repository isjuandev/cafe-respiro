"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Pelicula = {
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
};

export default function BibliotecaPage() {
  const router = useRouter();
  const [peliculas, setPeliculas] = useState<Pelicula[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ titulo: "", director: "", genero: "", anio: "", duracionMin: "", sinopsis: "", posterUrl: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
          genero: form.genero.trim() || undefined,
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
      setForm({ titulo: "", director: "", genero: "", anio: "", duracionMin: "", sinopsis: "", posterUrl: "" });
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
      if (!Number.isInteger(cupo) || cupo < 1 || cupo > 15) throw new Error("Cupos debe ser 1-15 (sala única)");
      const res = await fetch(`/api/admin/peliculas/${programarId}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fechaHora: new Date(`${fechaHora}T19:00:00`).toISOString(), cupoTotal: cupo }),
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
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Biblioteca</h2>
          <p className="text-xs text-white/40">Catálogo para programar funciones. Sin unique duro: si el título es muy similar, avisa.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black hover:bg-[#D4A574]">
          {showForm ? "Cerrar" : "+ Nueva película"}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleCreate} className="relative grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-2xl border border-[#E8B86A]/20 bg-[#141414] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Nueva película</h3>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full bg-white/10 p-2 text-white/60 hover:bg-white/20 hover:text-white">
                ✕
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs tracking-wide text-white/60">Título *</label>
                <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Dune" required autoFocus className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs tracking-wide text-white/60">Director</label>
                <input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} placeholder="Villeneuve" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs tracking-wide text-white/60">Género</label>
                <input value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })} placeholder="Drama, Animación..." className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-white" />
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
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-white hover:bg-white/5">
                Cancelar
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-[#E8B86A] py-3 text-sm font-bold text-black">
                Guardar
              </button>
            </div>
            <p className="text-center text-[10px] text-white/20">Sin unique duro: aviso si título muy similar ya existe.</p>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
        <h3 className="text-xs font-bold tracking-[0.15em] text-white">PELÍCULAS EN BIBLIOTECA</h3>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(peliculas || []).map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex-1">
                <div className="truncate text-sm font-bold text-white">{p.titulo}</div>
                <div className="text-xs text-white/40">
                  {p.genero || p.director || "—"} {p.anio ? `· ${p.anio}` : ""} {p.duracionMin ? `· ${p.duracionMin}min` : ""}
                </div>
                <div className="mt-1 text-xs text-white/30">Funciones: {p._count?.funciones ?? 0}</div>
              </div>
              <button
                onClick={() => setProgramarId(p.id)}
                className="mt-3 w-full rounded-lg border border-[#E8B86A]/20 bg-[#E8B86A]/10 py-1.5 text-xs font-medium text-[#E8B86A] hover:bg-[#E8B86A]/20"
              >
                Programar
              </button>
            </div>
          ))}
          {(!peliculas || peliculas.length === 0) && <p className="col-span-full text-center text-xs text-white/30">Biblioteca vacía. Crea la primera película.</p>}
        </div>
      </div>

      <form onSubmit={handleProgramar} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div className="min-w-0 flex-1">
          <label className="text-xs text-white/60">Película</label>
          <select value={programarId} onChange={(e) => setProgramarId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white" required>
            <option value="">— Elige de biblioteca —</option>
            {(peliculas || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/60">Fecha (7:00 PM)</label>
          <input id="bib-fecha" type="date" required className="mt-1 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white sm:w-auto" />
        </div>
        <div>
          <label className="text-xs text-white/60">Cupo</label>
          <input id="bib-cupo" type="number" defaultValue={15} min={1} max={15} className="mt-1 w-20 rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white" />
        </div>
        <button type="submit" className="rounded-xl bg-[#E8B86A] px-6 py-3 text-sm font-bold text-black">
          Programar
        </button>
      </form>
      {progError && <p className="text-xs text-red-300">{progError}</p>}
      {progSuccess && <p className="text-xs text-green-300">{progSuccess} · Ver en cartelera</p>}
    </div>
  );
}
