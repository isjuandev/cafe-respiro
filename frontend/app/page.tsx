"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaStar, FaUsers, FaArrowRight, FaClock, FaLightbulb, FaVoteYea, FaCalendarAlt } from "react-icons/fa";

type Pelicula = {
  id: string;
  titulo: string;
  director?: string | null;
  anio?: number | null;
  duracionMin?: number | null;
  sinopsis?: string | null;
};

type Funcion = {
  id: string;
  peliculaId: string;
  pelicula: Pelicula;
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  createdAt: string;
};

function formatHeroDate(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-UY", { weekday: "long" }).toUpperCase();
  const time = d.toLocaleTimeString("es-UY", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${day} · ${time}`;
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("es-UY", { weekday: "long" });
  const day = d.getDate();
  const time = d.toLocaleTimeString("es-UY", { hour: "numeric", minute: "2-digit", hour12: true });
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1) + ` ${day}`, time: time.toUpperCase() };
}

function getGenre(p: Pelicula) {
  if (p.titulo.toLowerCase().includes("chihiro")) return "Animación";
  if (p.titulo.toLowerCase().includes("paras")) return "Drama";
  if (p.titulo.toLowerCase().includes("whiplash")) return "Drama";
  if (p.titulo.toLowerCase().includes("interstellar")) return "Ciencia ficción";
  if (p.titulo.toLowerCase().includes("retrato")) return "Drama";
  return p.director || "Cine";
}

function getPoster(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("whiplash")) return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=400&fit=crop&crop=center";
  if (t.includes("chihiro")) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=400&fit=crop";
  if (t.includes("interstellar")) return "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=600&fit=crop";
  if (t.includes("paras")) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop";
  if (t.includes("retrato")) return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop";
  return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop";
}

function getHeroBg(titulo: string) {
  if (titulo.toLowerCase().includes("interstellar"))
    return "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1600&h=900&fit=crop";
  if (titulo.toLowerCase().includes("chihiro"))
    return "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=1600&h=900&fit=crop";
  return "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&h=900&fit=crop";
}

export default function CarteleraPage() {
  const [funciones, setFunciones] = useState<Funcion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [reservaForm, setReservaForm] = useState<Record<string, { nombre: string; contacto: string; cantidad: number }>>({});
  const [reservaLoading, setReservaLoading] = useState<Record<string, boolean>>({});
  const [reservaError, setReservaError] = useState<Record<string, string | null>>({});
  const [reservaSuccess, setReservaSuccess] = useState<Record<string, string | null>>({});
  const [expandedReserva, setExpandedReserva] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/funciones");
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setFunciones(data.funciones);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReservar(funcionId: string) {
    const f = reservaForm[funcionId] || { nombre: "", contacto: "", cantidad: 1 };
    if (f.nombre.trim().length < 2) {
      setReservaError((p) => ({ ...p, [funcionId]: "Nombre mínimo 2 caracteres" }));
      return;
    }
    if (f.contacto.trim().length < 2) {
      setReservaError((p) => ({ ...p, [funcionId]: "Contacto obligatorio" }));
      return;
    }
    if (!Number.isInteger(f.cantidad) || f.cantidad < 1 || f.cantidad > 10) {
      setReservaError((p) => ({ ...p, [funcionId]: "Cantidad debe ser 1-10" }));
      return;
    }
    try {
      setReservaLoading((p) => ({ ...p, [funcionId]: true }));
      setReservaError((p) => ({ ...p, [funcionId]: null }));
      setReservaSuccess((p) => ({ ...p, [funcionId]: null }));
      const res = await fetch(`/api/funciones/${funcionId}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.nombre.trim(), contacto: f.contacto.trim(), cantidad: f.cantidad }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || `Error ${res.status}`;
        throw new Error(msg);
      }
      setReservaSuccess((p) => ({ ...p, [funcionId]: `¡Reserva confirmada! Quedan ${data.cuposDisponibles} cupos.` }));
      setExpandedReserva(null);
      load();
    } catch (err) {
      setReservaError((p) => ({ ...p, [funcionId]: err instanceof Error ? err.message : "Error" }));
    } finally {
      setReservaLoading((p) => ({ ...p, [funcionId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="bg-[#050507]">
        <div className="mx-auto max-w-[1280px] animate-pulse px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-[420px] rounded-2xl bg-white/5" />
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-64 rounded-xl bg-white/5" />
            <div className="h-64 rounded-xl bg-white/5" />
            <div className="h-64 rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="font-medium text-red-400">No se pudo cargar la cartelera</p>
          <p className="mt-2 text-sm text-white/60">{error}</p>
          <button onClick={load} className="mt-4 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no hay funciones, usamos el placeholder de la imagen (Interstellar)
  const hasFunciones = funciones && funciones.length > 0;
  const hero: Funcion | null = hasFunciones ? funciones[0] : null;
  const proximas: (Funcion | null)[] = hasFunciones
    ? [
        funciones[1] || null,
        funciones[2] || null,
        null, // tercer card es "Sorpresa" como en el diseño
      ]
    : [null, null, null];

  // Datos para hero: si no hay datos reales, mostramos Próximamente sin detalles (consume backend siempre)
  const heroTitulo = hero?.pelicula.titulo || "PRÓXIMAMENTE";
  const heroSinopsis = hero?.pelicula.sinopsis || "Próximamente nuevas funciones. Sugiere una película y ayúdanos a programar la cartelera.";
  const heroMeta = hero ? `${getGenre(hero.pelicula)} · ${hero.pelicula.duracionMin ? `${Math.floor(hero.pelicula.duracionMin / 60)}h ${hero.pelicula.duracionMin % 60}min` : ""}`.replace(/ · $/, "") : "";
  const heroFecha = hero ? formatHeroDate(hero.fechaHora) : "PRÓXIMAMENTE";
  const heroCupos = hero ? `${hero.cuposOcupados} / ${hero.cupoTotal} cupos` : "";
  const heroCuposDisponibles = hero ? hero.cuposDisponibles : 0;
  const heroBg = hero ? getHeroBg(heroTitulo) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&h=900&fit=crop";
  const heroId = hero?.id || "hero-placeholder";

  return (
    <div className="bg-[#050507] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt={heroTitulo} className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 70% 20%, rgba(232,184,106,0.15) 0%, transparent 50%)" }} />
        </div>

        {/* Imagen del astronauta / nave sobre el agua - simulada con overlay */}
        <div className="absolute inset-0 hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1600&h=900&fit=crop"
            alt=""
            className="absolute bottom-0 right-0 h-full w-[65%] object-cover object-left opacity-0"
          />
        </div>

        <div className="relative mx-auto flex max-w-[1280px] flex-col px-4 py-8 sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:px-8 lg:py-16">
          <div className="max-w-xl flex-1">
            <p className="text-sm font-medium tracking-[0.2em] text-[#E8B86A]">{heroFecha}</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl lg:text-[72px] lg:leading-none">
              {heroTitulo.toUpperCase()}
            </h1>
            {heroMeta && <p className="mt-3 text-sm text-white/70">{heroMeta}</p>}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">{heroSinopsis}</p>

            {hero && (
              <div className="mt-6 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FaStar className="text-[#E8B86A] text-sm" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex items-center gap-2 text-sm">
                  <FaUsers className="text-[#E8B86A] text-sm" />
                  <span className={heroCuposDisponibles === 0 ? "text-red-400" : "text-white"}>{heroCuposDisponibles > 0 ? heroCupos : "Completo"}</span>
                </div>
              </div>
            )}

            {hero ? (
              <>
                {reservaSuccess[heroId] && (
                  <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {reservaSuccess[heroId]}
                  </div>
                )}
                {reservaError[heroId] && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {reservaError[heroId]}
                  </div>
                )}
                {expandedReserva === heroId ? (
                  <div className="mt-6 max-w-md rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
                    <div className="grid gap-3">
                      <input
                        placeholder="Tu nombre"
                        value={reservaForm[heroId]?.nombre || ""}
                        onChange={(e) => setReservaForm((p) => ({ ...p, [heroId]: { ...p[heroId], nombre: e.target.value, contacto: p[heroId]?.contacto || "", cantidad: p[heroId]?.cantidad || 1 } }))}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#E8B86A]/50 focus:outline-none"
                      />
                      <input
                        placeholder="Tu contacto (email/tel)"
                        value={reservaForm[heroId]?.contacto || ""}
                        onChange={(e) => setReservaForm((p) => ({ ...p, [heroId]: { ...p[heroId], contacto: e.target.value, nombre: p[heroId]?.nombre || "", cantidad: p[heroId]?.cantidad || 1 } }))}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#E8B86A]/50 focus:outline-none"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={reservaForm[heroId]?.cantidad ?? 1}
                          onChange={(e) => setReservaForm((p) => ({ ...p, [heroId]: { ...p[heroId], cantidad: parseInt(e.target.value) || 1, nombre: p[heroId]?.nombre || "", contacto: p[heroId]?.contacto || "" } }))}
                          className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
                        />
                        <span className="text-xs text-white/50">personas · 1-10</span>
                        <button onClick={() => setExpandedReserva(null)} className="ml-auto text-xs text-white/60 hover:text-white">
                          Cancelar
                        </button>
                      </div>
                      <button
                        onClick={() => handleReservar(heroId)}
                        disabled={!!reservaLoading[heroId]}
                        className="w-full rounded-lg bg-[#E8B86A] py-3 text-sm font-bold tracking-wide text-black hover:bg-[#D4A574] disabled:opacity-50"
                      >
                        {reservaLoading[heroId] ? "RESERVANDO…" : "CONFIRMAR RESERVA"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedReserva(heroId)}
                    disabled={heroCuposDisponibles === 0}
                    className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#E8B86A] px-8 py-3.5 text-sm font-bold tracking-wide text-black transition-colors hover:bg-[#D4A574] disabled:bg-white/10 disabled:text-white/40"
                  >
                    {heroCuposDisponibles === 0 ? "CUPO LLENO" : "RESERVAR CUPO"}
                    <FaArrowRight className="text-xs" />
                  </button>
                )}
              </>
            ) : (
              <button
                disabled
                className="mt-6 inline-flex items-center gap-3 rounded-lg bg-white/10 px-8 py-3.5 text-sm font-bold tracking-wide text-white/40 cursor-not-allowed"
              >
                PRÓXIMAMENTE
              </button>
            )}
          </div>

          <div className="relative mt-8 hidden flex-1 lg:mt-0 lg:block lg:h-[420px]">
            <div className="absolute inset-0 flex items-end justify-end">
              <div className="relative h-full w-full max-w-[720px]">
                <img
                  src="https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1000&h=700&fit=crop&crop=bottom"
                  alt="Astronauta"
                  className="h-full w-full object-cover opacity-0"
                />
                <div className="absolute bottom-0 right-0 text-right">
                  <div className="h-[340px] w-[520px] rounded-2xl bg-gradient-to-t from-[#050507] to-transparent opacity-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRÓXIMAS FUNCIONES */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] text-white">
            <FaCalendarAlt className="text-[#E8B86A]" /> PRÓXIMAS FUNCIONES
          </h2>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium tracking-wide text-[#E8B86A] hover:text-[#D4A574]">
            Ver todas <FaArrowRight className="text-[10px]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {proximas.map((f, idx) => {
            const isPlaceholder = !f;
            const titulo = f?.pelicula.titulo || "PRÓXIMAMENTE";
            const cupos = f ? `${f.cuposOcupados} / ${f.cupoTotal} cupos` : "";
            const lleno = f ? f.cuposDisponibles === 0 : true;
            const fecha = f ? formatShortDate(f.fechaHora) : null;
            const meta = f ? `${getGenre(f.pelicula)} · ${f.pelicula.duracionMin ? `${Math.floor(f.pelicula.duracionMin / 60)}h ${f.pelicula.duracionMin % 60}min` : ""}`.replace(/ · $/, "") : "";
            const poster = f ? getPoster(titulo) : "";
            const fid = f?.id || `placeholder-${idx}`;

            return (
              <div key={fid} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
                {isPlaceholder ? (
                  <div className="relative h-48 bg-gradient-to-b from-[#0f0f0f] to-black flex flex-col items-center justify-center p-6">
                    <div className="text-center">
                      <div className="text-sm font-bold tracking-[0.2em] text-white/60">PRÓXIMAMENTE</div>
                      <div className="mt-2 h-px w-12 mx-auto bg-white/10" />
                      <p className="mt-3 text-xs text-white/30">Consume el backend</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 overflow-hidden">
                    <img src={poster} alt={titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur">{titulo.toUpperCase()}</div>
                  </div>
                )}
                <div className="p-4">
                  {fecha ? (
                    <>
                      <div className="text-xs font-bold tracking-wide text-white">{fecha.weekday}</div>
                      <div className="text-xs font-bold tracking-wide text-white">{fecha.time}</div>
                      <div className="mt-2 text-xs text-white/60">{meta}</div>
                      <div className={`mt-3 flex items-center gap-1.5 text-xs ${lleno ? "text-white/40" : "text-[#E8B86A]"}`}>
                        <FaUsers className="text-xs" /> {cupos}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold tracking-wide text-white/40">PRÓXIMAMENTE</div>
                      <div className="mt-2 text-xs text-white/30">Sin fecha programada</div>
                    </>
                  )}

                  {f ? (
                    <>
                      {reservaSuccess[fid] && <div className="mt-3 rounded bg-green-500/10 px-3 py-2 text-xs text-green-300">{reservaSuccess[fid]}</div>}
                      {reservaError[fid] && <div className="mt-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-300">{reservaError[fid]}</div>}
                      {expandedReserva === fid ? (
                        <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                          <input
                            placeholder="Tu nombre"
                            value={reservaForm[fid]?.nombre || ""}
                            onChange={(e) => setReservaForm((p) => ({ ...p, [fid]: { ...p[fid], nombre: e.target.value, contacto: p[fid]?.contacto || "", cantidad: p[fid]?.cantidad || 1 } }))}
                            className="w-full rounded border border-white/10 bg-white/5 px-2 py-2 text-xs text-white placeholder:text-white/40"
                          />
                          <input
                            placeholder="Tu contacto"
                            value={reservaForm[fid]?.contacto || ""}
                            onChange={(e) => setReservaForm((p) => ({ ...p, [fid]: { ...p[fid], contacto: e.target.value, nombre: p[fid]?.nombre || "", cantidad: p[fid]?.cantidad || 1 } }))}
                            className="w-full rounded border border-white/10 bg-white/5 px-2 py-2 text-xs text-white placeholder:text-white/40"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setExpandedReserva(null)} className="flex-1 rounded border border-white/10 py-2 text-xs text-white/70">
                              Cancelar
                            </button>
                            <button onClick={() => handleReservar(fid)} disabled={!!reservaLoading[fid]} className="flex-1 rounded bg-[#E8B86A] py-2 text-xs font-bold text-black disabled:opacity-50">
                              {reservaLoading[fid] ? "..." : "Confirmar"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => (f ? setExpandedReserva(fid) : null)}
                          disabled={lleno}
                          className={`mt-4 w-full rounded-lg border py-2.5 text-xs font-bold tracking-wide transition-colors ${lleno ? "border-white/10 bg-white/5 text-white/30" : "border-[#E8B86A]/50 text-[#E8B86A] hover:bg-[#E8B86A] hover:text-black"}`}
                        >
                          {lleno ? "COMPLETO" : "RESERVAR"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      disabled
                      className="mt-4 w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold tracking-wide text-white/30"
                    >
                      PRÓXIMAMENTE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TÚ DECIDES */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10">
          <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1280&h=400&fit=crop" alt="Café" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="relative grid gap-6 p-6 lg:grid-cols-2 lg:p-8">
            <div>
              <h2 className="text-xl font-bold tracking-wide text-white">TÚ DECIDES QUÉ VEMOS</h2>
              <p className="mt-1 text-sm text-white/70">Café Respiro también se programa contigo.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href="/votar" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur hover:bg-black/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8B86A]/10 text-[#E8B86A]">
                    <FaVoteYea className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold tracking-wide text-white">VOTA</div>
                    <div className="text-xs text-white/60">Elige la próxima película.</div>
                  </div>
                  <FaArrowRight className="text-white/40 group-hover:text-white" />
                </Link>
                <Link href="/sugerencias" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur hover:bg-black/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8B86A]/10 text-[#E8B86A]">
                    <FaLightbulb className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold tracking-wide text-white">SUGIERE</div>
                    <div className="text-xs text-white/60">¿Hay una película que deberíamos proyectar?</div>
                  </div>
                  <FaArrowRight className="text-white/40 group-hover:text-white" />
                </Link>
              </div>
            </div>
            <div className="hidden items-center justify-end lg:flex">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300&h=300&fit=crop" alt="Taza" className="h-32 w-32 rounded-full object-cover opacity-0" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-20 w-28 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold tracking-widest text-[#E8B86A]">CAFÉ<br/>RESPIRO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESTAURANTE */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop" alt="Plato" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#141414] p-6">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#6B8E6B]">
              <FaClock className="text-[#6B8E6B]" /> RESTAURANTE
            </div>
            <p className="mt-3 text-sm font-medium text-white">De 3:00 PM a 7:00 PM</p>
            <p className="mt-1 text-sm leading-relaxed text-white/60">Disfruta nuestro menú antes de la función.</p>
            <Link href="/" className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-[#6B8E6B]/50 px-4 py-2 text-xs font-bold tracking-wide text-[#6B8E6B] hover:bg-[#6B8E6B] hover:text-black">
              VER MENÚ <FaArrowRight className="text-xs" />
            </Link>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-[#0a0a0a] p-6 text-right">
            <p className="font-serif text-2xl italic leading-tight text-white/90">“Respira, disfruta</p>
            <p className="font-serif text-2xl italic leading-tight text-white/90">y déjate sorprender.”</p>
            <p className="mt-4 text-xs font-bold tracking-[0.2em] text-[#E8B86A]">CAFÉ RESPIRO</p>
          </div>
        </div>
      </section>
    </div>
  );
}
