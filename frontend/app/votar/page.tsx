"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaFilm, FaLightbulb, FaUsers, FaCalendarAlt, FaClock, FaHeart, FaRegHeart, FaArrowRight, FaWhatsapp } from "react-icons/fa";
import { PageHero } from "@/components/PageHero";

type Sugerencia = {
  id: string;
  titulo: string;
  comentario?: string | null;
  director?: string | null;
  anio?: number | null;
  genero?: string | null;
  duracionMin?: number | null;
  sinopsis?: string | null;
  posterUrl?: string | null;
  nombreSolicitante: string;
  estado: string;
  createdAt: string;
  _count?: { votos: number };
};

type Funcion = {
  id: string;
  fechaHora: string;
  cupoTotal: number;
  cuposDisponibles?: number;
  pelicula?: { titulo: string; posterUrl?: string | null; genero?: string | null } | null;
};

type Votacion = {
  activa: boolean;
  cierraAt?: string;
};

const VOTOS_KEY = "cafe-respiro:votos";

function getVotadas(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VOTOS_KEY) || "[]");
  } catch {
    return [];
  }
}

function formatDuration(min?: number | null) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}min`;
}

function getPosterUrl(s: Pick<Sugerencia, "posterUrl">) {
  return s.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop";
}

function getGenreLabel(s: Pick<Sugerencia, "genero">) {
  return s.genero || "Cine";
}

export default function VotarPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [funciones, setFunciones] = useState<Funcion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votadas, setVotadas] = useState<string[]>([]);
  const [votoLoading, setVotoLoading] = useState<Record<string, boolean>>({});
  const [showVotoForm, setShowVotoForm] = useState<string | null>(null);
  const [votoForm, setVotoForm] = useState<Record<string, { nombre: string; contacto: string }>>({});
  const [votoError, setVotoError] = useState<Record<string, string | null>>({});
  const [votacion, setVotacion] = useState<Votacion | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    setVotadas(getVotadas());
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [vRes, fRes] = await Promise.all([fetch("/api/votaciones/activa"), fetch("/api/funciones")]);
      if (!vRes.ok) throw new Error(await vRes.text());
      if (!fRes.ok) throw new Error(await fRes.text());
      const vData = await vRes.json();
      const fData = await fRes.json();
      setVotacion(vData);
      setSugerencias(vData.sugerencias || []);
      setFunciones(fData.funciones);
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

  useEffect(() => {
    const update = () => {
      const closeAt = votacion?.cierraAt ? new Date(votacion.cierraAt).getTime() : 0;
      const next = Math.max(0, closeAt - Date.now());
      setRemainingMs(next);
      if (closeAt && next === 0) load();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [votacion?.cierraAt]);

  async function handleVotar(id: string) {
    const f = votoForm[id] || { nombre: "", contacto: "" };
    if (f.nombre.trim().length < 2 || f.contacto.trim().length < 2) {
      setVotoError((p) => ({ ...p, [id]: "Nombre y contacto requeridos" }));
      return;
    }
    try {
      setVotoLoading((p) => ({ ...p, [id]: true }));
      setVotoError((p) => ({ ...p, [id]: null }));
      const res = await fetch(`/api/sugerencias/${id}/votos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.nombre.trim(), contacto: f.contacto.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          const next = [...new Set([...getVotadas(), id])];
          localStorage.setItem(VOTOS_KEY, JSON.stringify(next));
          setVotadas(next);
        }
        throw new Error(data.message || "Error");
      }
      const next = [...new Set([...getVotadas(), id])];
      localStorage.setItem(VOTOS_KEY, JSON.stringify(next));
      setVotadas(next);
      setShowVotoForm(null);
      load();
    } catch (e) {
      setVotoError((p) => ({ ...p, [id]: e instanceof Error ? e.message : "Error" }));
    } finally {
      setVotoLoading((p) => ({ ...p, [id]: false }));
    }
  }

  const totalVotos = (sugerencias || []).reduce((s, x) => s + (x._count?.votos || 0), 0) || 100;
  const top5 = [...(sugerencias || [])].sort((a, b) => (b._count?.votos || 0) - (a._count?.votos || 0)).slice(0, 5);
  const proximaFuncion = funciones && funciones.length > 0 ? funciones[0] : null;
  const totalSeconds = Math.floor(remainingMs / 1000);
  const remainingDays = Math.floor(totalSeconds / 86400);
  const remainingHours = Math.floor((totalSeconds % 86400) / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const countdown = remainingDays > 0
    ? `${remainingDays} día${remainingDays === 1 ? "" : "s"} ${remainingHours} h`
    : `${remainingHours} h ${remainingMinutes} min ${remainingSeconds.toString().padStart(2, "0")} s`;

  if (loading) {
    return (
      <div className="bg-[#050507] px-4 py-12">
        <div className="mx-auto max-w-[1280px] animate-pulse">
          <div className="h-[300px] rounded-2xl bg-white/5" />
          <div className="mt-6 h-64 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-red-300">{error}</p>
          <button onClick={load} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050507] text-white">
      <PageHero
        title="VOTA"
        subtitle="TÚ ELIGES QUÉ VEMOS"
        description="Cada voto cuenta. La película más votada será parte de nuestra próxima función."
        image="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&h=700&fit=crop"
        alt="Proyector"
      />

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-[0.15em]">
                <span className="text-[#E8B86A]">▦</span> VOTACIÓN ACTIVA
              </h2>
              {votacion?.activa && remainingMs > 0 && <span className="flex items-center gap-1.5 text-xs text-[#E8B86A]">
                <FaClock /> Cierre de votación: {countdown}
              </span>}
              {(!votacion?.activa || remainingMs === 0) && <span className="flex items-center gap-1.5 text-xs text-white/50">
                <FaClock /> Votación cerrada
              </span>}
            </div>

            {(sugerencias || []).map((s) => {
              const votos = s._count?.votos || 0;
              const pct = totalVotos ? Math.round((votos / totalVotos) * 100) : 0;
              const displayPct = votos === 0 ? 0 : Math.max(5, pct);
              const yaVoto = votadas.includes(s.id);
              const poster = getPosterUrl(s);
              const genre = getGenreLabel(s);
              const year = s.anio ? String(s.anio) : "";
              const duration = formatDuration(s.duracionMin);
              const desc = s.sinopsis || s.comentario || "";
              const isVotando = showVotoForm === s.id;

              return (
                <div key={s.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
                  <div className="flex gap-4 p-4">
                    <div className="h-[140px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl bg-black">
                      <img src={poster} alt={s.titulo} className="h-full w-full object-cover" />
                      <div className="relative -mt-6 bg-gradient-to-t from-black to-transparent p-1 text-center">
                        <span className="text-[8px] font-bold tracking-widest text-white/80">{s.titulo.toUpperCase().slice(0, 18)}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h3 className="text-sm font-bold tracking-wide text-white">{s.titulo.toUpperCase()}</h3>
                      <p className="mt-1 text-xs text-white/50">
                        {[genre, year, duration].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/60">{desc}</p>
                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div className="flex-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#E8B86A] transition-all" style={{ width: `${displayPct}%` }} />
                          </div>
                          <div className="mt-1 text-right text-[10px] text-white/50">{pct}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#E8B86A]">{votos}</div>
                        <div className="text-[10px] tracking-wide text-white/50">votos</div>
                      </div>
                      <button
                        onClick={() => {
                          if (yaVoto) return;
                          if (!isVotando) {
                            setShowVotoForm(s.id);
                            setVotoError((p) => ({ ...p, [s.id]: null }));
                          } else {
                            handleVotar(s.id);
                          }
                        }}
                        disabled={yaVoto || votoLoading[s.id]}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${yaVoto ? "border-[#E8B86A] bg-[#E8B86A] text-black" : "border-white/20 text-white hover:border-[#E8B86A] hover:text-[#E8B86A]"}`}
                      >
                        {yaVoto ? <FaHeart className="text-sm" /> : votoLoading[s.id] ? "…" : <FaRegHeart className="text-sm" />}
                      </button>
                      {isVotando && !yaVoto && (
                        <div className="w-40 rounded-lg border border-white/10 bg-black p-2">
                          <input
                            placeholder="Tu nombre"
                            value={votoForm[s.id]?.nombre || ""}
                            onChange={(e) => setVotoForm((p) => ({ ...p, [s.id]: { ...p[s.id], nombre: e.target.value, contacto: p[s.id]?.contacto || "" } }))}
                            className="mb-1 w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/30"
                          />
                          <input
                            placeholder="Tu contacto"
                            value={votoForm[s.id]?.contacto || ""}
                            onChange={(e) => setVotoForm((p) => ({ ...p, [s.id]: { ...p[s.id], contacto: e.target.value, nombre: p[s.id]?.nombre || "" } }))}
                            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/30"
                          />
                          {votoError[s.id] && <p className="mt-1 text-[10px] text-red-400">{votoError[s.id]}</p>}
                          <div className="mt-2 flex gap-1">
                            <button onClick={() => setShowVotoForm(null)} className="flex-1 rounded bg-white/10 py-1 text-xs text-white">
                              Cancelar
                            </button>
                            <button onClick={() => handleVotar(s.id)} className="flex-1 rounded bg-[#E8B86A] py-1 text-xs font-bold text-black">
                              Votar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {(!sugerencias || sugerencias.length === 0) && (
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 text-center">
                <p className="text-white/60">Aún no hay películas en votación.</p>
                <Link href="/sugerencias" className="mt-4 inline-block rounded-lg bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black">
                  Sugerir una
                </Link>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-white">
                <FaFilm className="text-[#E8B86A]" /> CÓMO FUNCIONA
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#E8B86A]/50 text-xs font-bold text-[#E8B86A]">1</span>
                  <p className="text-xs leading-relaxed text-white/70">Explora las películas en votación.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#E8B86A]/50 text-xs font-bold text-[#E8B86A]">2</span>
                  <p className="flex items-center gap-1 text-xs leading-relaxed text-white/70">
                    Dale <FaHeart className="text-[#E8B86A] text-xs" /> a la película que quieres ver.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#E8B86A]/50 text-xs font-bold text-[#E8B86A]">3</span>
                  <p className="text-xs leading-relaxed text-white/70">La más votada se proyectará muy pronto.</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-[#E8B86A]/10 p-3">
                <p className="flex items-center gap-2 text-xs text-[#E8B86A]">
                  <FaLightbulb className="text-[#E8B86A]" /> Puedes votar todas las veces que quieras.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h3 className="text-xs font-bold tracking-[0.15em] text-white">TOP 5 MÁS VOTADAS</h3>
              <div className="mt-4 space-y-2.5">
                {top5.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{idx + 1}.</span>
                    <span className="flex-1 px-2 text-white/80 truncate">{s.titulo}</span>
                    <span className="font-bold text-white">{s._count?.votos || 0}</span>
                    <FaHeart className="ml-1 text-[#E8B86A] text-[10px]" />
                  </div>
                ))}
                {top5.length === 0 && <p className="text-xs text-white/40">Sin votos aún</p>}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1205] p-6">
              <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop" alt="Cine" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="relative text-center">
                <h3 className="text-sm font-bold tracking-wide text-[#E8B86A]">CAFÉ, CINE</h3>
                <h3 className="text-sm font-bold tracking-wide text-[#E8B86A]">Y BUENAS HISTORIAS</h3>
                <p className="mt-2 text-xs text-white/70">Te esperamos cada día</p>
                <p className="text-xs text-white/70">a las 7:00 PM ☕</p>
              </div>
            </div>
          </div>
        </div>

        {/* PRÓXIMA FUNCIÓN */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141414] p-4 sm:flex-row sm:p-5">
          <div className="flex items-center gap-4">
            {proximaFuncion?.pelicula?.titulo ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8B86A]/15 text-sm font-bold text-[#E8B86A]">
                <FaFilm />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-white/20 text-xl text-white/40">?</div>
            )}
            <div>
              <div className="text-xs font-bold tracking-wide text-white">
                {proximaFuncion?.pelicula?.titulo ? proximaFuncion.pelicula.titulo.toUpperCase() : "PELÍCULA"}
              </div>
              <div className={`text-xs font-bold tracking-wide ${proximaFuncion?.pelicula?.titulo ? "text-[#E8B86A]" : "text-white/60"}`}>
                {proximaFuncion?.pelicula?.titulo ? "PROGRAMADA" : "POR DEFINIR"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-white/50">
                <FaCalendarAlt className="text-xs" /> FECHA
              </div>
              <div className="mt-1 font-medium text-white">
                {proximaFuncion ? new Date(proximaFuncion.fechaHora).toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long" }) : "Viernes 30 de mayo"}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-white/50">
                <FaClock className="text-xs" /> HORA
              </div>
              <div className="mt-1 font-medium text-white">
                {proximaFuncion ? new Date(proximaFuncion.fechaHora).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }) : "7:00 PM"}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-white/50">
                <FaUsers className="text-xs" /> CUPOS DISPONIBLES
              </div>
              <div className="mt-1 font-medium text-white">{proximaFuncion ? `${proximaFuncion.cuposDisponibles} / ${proximaFuncion.cupoTotal}` : "8 / 8"}</div>
            </div>
          </div>
          {proximaFuncion ? (
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-[#E8B86A] px-6 py-3 text-xs font-bold tracking-wide text-black hover:bg-[#D4A574]">
              RESERVAR CUPO <FaArrowRight className="text-xs" />
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-xs font-bold tracking-wide text-white/40">
              PRÓXIMAMENTE <FaArrowRight className="text-xs" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
