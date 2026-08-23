"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaLightbulb, FaPaperPlane, FaCheck, FaExclamationTriangle } from "react-icons/fa";

type Sugerencia = {
  id: string;
  titulo: string;
  comentario?: string | null;
  nombreSolicitante: string;
  estado: string;
  createdAt: string;
  _count?: { votos: number };
};

export default function SugerirPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ titulo: "", comentario: "", nombre: "", contacto: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submit, setSubmit] = useState<{ loading: boolean; error: string | null; success: string | null; duplicada: Sugerencia | null }>({
    loading: false,
    error: null,
    success: null,
    duplicada: null,
  });

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/sugerencias");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSugerencias(data.sugerencias);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (form.titulo.trim().length < 2) e.titulo = "Mínimo 2 caracteres";
    if (form.titulo.trim().length > 120) e.titulo = "Máximo 120 caracteres";
    if (form.comentario && form.comentario.length > 500) e.comentario = "Máximo 500 caracteres";
    if (form.nombre.trim().length < 2) e.nombre = "Mínimo 2 caracteres";
    if (form.nombre.trim().length > 60) e.nombre = "Máximo 60 caracteres";
    if (form.contacto.trim().length < 2) e.contacto = "Contacto requerido";
    if (form.contacto.trim().length > 100) e.contacto = "Máximo 100 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmit({ loading: false, error: null, success: null, duplicada: null });
    if (!validate()) return;
    try {
      setSubmit({ loading: true, error: null, success: null, duplicada: null });
      const res = await fetch("/api/sugerencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          comentario: form.comentario.trim() || undefined,
          nombre: form.nombre.trim(),
          contacto: form.contacto.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || "Error";
        throw new Error(msg);
      }
      if (data.duplicada) {
        setSubmit({ loading: false, error: null, success: null, duplicada: data.sugerencia });
      } else {
        setSubmit({ loading: false, error: null, success: "¡Sugerencia enviada! Gracias por tu aporte.", duplicada: null });
        setForm({ titulo: "", comentario: "", nombre: "", contacto: "" });
        load();
      }
    } catch (err) {
      setSubmit({ loading: false, error: err instanceof Error ? err.message : "Error", success: null, duplicada: null });
    }
  }

  return (
    <div className="bg-[#050507] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&h=700&fit=crop" alt="Café" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] to-transparent" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8B86A]/20 bg-[#E8B86A]/10 px-3 py-1 text-xs font-medium tracking-wide text-[#E8B86A]">
              <FaLightbulb className="text-xs" /> TU VOZ CUENTA
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl" style={{ fontFamily: "Impact, sans-serif" }}>
              SUGIERE
            </h1>
            <p className="mt-2 text-lg font-bold tracking-[0.2em] text-[#E8B86A]">¿QUÉ QUIERES VER?</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Propón la próxima película de Café Respiro. Las más sugeridas entran a votación.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* FORM */}
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] text-white">
              <FaLightbulb className="text-[#E8B86A]" /> NUEVA SUGERENCIA
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium tracking-wide text-white/70">TÍTULO *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Perfect Days"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none"
                />
                {errors.titulo && <p className="mt-1 text-xs text-red-400">{errors.titulo}</p>}
              </div>
              <div>
                <label className="text-xs font-medium tracking-wide text-white/70">COMENTARIO (opcional)</label>
                <textarea
                  value={form.comentario}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  placeholder="¿Por qué la recomiendas?"
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none"
                />
                {errors.comentario && <p className="mt-1 text-xs text-red-400">{errors.comentario}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium tracking-wide text-white/70">TU NOMBRE *</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Juan"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none"
                  />
                  {errors.nombre && <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium tracking-wide text-white/70">CONTACTO *</label>
                  <input
                    value={form.contacto}
                    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                    placeholder="juan@email.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none"
                  />
                  {errors.contacto && <p className="mt-1 text-xs text-red-400">{errors.contacto}</p>}
                </div>
              </div>

              {submit.error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <FaExclamationTriangle /> {submit.error}
                </div>
              )}
              {submit.success && (
                <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                  <FaCheck /> {submit.success}
                </div>
              )}
              {submit.duplicada && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-300">
                    <FaExclamationTriangle /> Ya existe
                  </p>
                  <p className="mt-1 text-sm text-amber-200/80">“{submit.duplicada.titulo}” ya fue sugerida. ¡Ve a votar por ella!</p>
                  <Link href="/votar" className="mt-3 inline-flex rounded-lg bg-[#E8B86A] px-4 py-2 text-xs font-bold text-black">
                    Ir a votar
                  </Link>
                </div>
              )}

              <button type="submit" disabled={submit.loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8B86A] py-3.5 text-sm font-bold tracking-wide text-black hover:bg-[#D4A574] disabled:opacity-50">
                <FaPaperPlane className="text-xs" /> {submit.loading ? "Enviando..." : "Enviar sugerencia"}
              </button>
            </form>
          </div>

          {/* SIDEBAR LISTA */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h3 className="text-xs font-bold tracking-[0.15em] text-white">CÓMO FUNCIONA</h3>
              <div className="mt-4 space-y-3 text-xs leading-relaxed text-white/60">
                <p>
                  <span className="font-bold text-white">1.</span> Escribe el título y por qué la recomiendas.
                </p>
                <p>
                  <span className="font-bold text-white">2.</span> Si ya existe, te avisamos para que la votes.
                </p>
                <p>
                  <span className="font-bold text-white">3.</span> Las más votadas se programan.
                </p>
              </div>
              <Link href="/votar" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#E8B86A]/20 bg-[#E8B86A]/10 py-2.5 text-xs font-bold text-[#E8B86A] hover:bg-[#E8B86A]/20">
                Ver votación <FaLightbulb className="text-xs" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h3 className="text-xs font-bold tracking-[0.15em] text-white">SUGERENCIAS RECIENTES</h3>
              {loading ? (
                <div className="mt-4 space-y-2">
                  <div className="h-12 animate-pulse rounded bg-white/5" />
                  <div className="h-12 animate-pulse rounded bg-white/5" />
                </div>
              ) : error ? (
                <p className="mt-4 text-xs text-red-300">{error}</p>
              ) : !sugerencias || sugerencias.length === 0 ? (
                <p className="mt-4 text-xs text-white/40">Aún no hay sugerencias. ¡Sé el primero!</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {sugerencias.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                      <span className="truncate text-xs text-white/80 max-w-[180px]">{s.titulo}</span>
                      <span className="text-xs text-white/30">{new Date(s.createdAt).toLocaleDateString("es-UY")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
