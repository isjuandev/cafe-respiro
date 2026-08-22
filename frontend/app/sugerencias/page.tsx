"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaFilm, FaLightbulb, FaUsers, FaCalendarAlt, FaClock, FaHeart, FaRegHeart, FaArrowRight, FaWhatsapp } from "react-icons/fa";

type Sugerencia = {
  id: string;
  titulo: string;
  comentario?: string | null;
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

function getPoster(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("interstellar")) return "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=400&fit=crop";
  if (t.includes("chihiro")) return "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=300&h=400&fit=crop&crop=top";
  if (t.includes("whiplash")) return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=400&fit=crop";
  if (t.includes("shrek")) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=400&fit=crop";
  if (t.includes("padrino")) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop";
  return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop";
}

function getMeta(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("interstellar")) return { genre: "Ciencia ficción", year: "2014", duration: "2h 49min", desc: "Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad." };
  if (t.includes("chihiro")) return { genre: "Animación", year: "2001", duration: "2h 5min", desc: "Una niña entra en un mundo mágico dominado por dioses y espíritus, donde deberá encontrar la fuerza para regresar con su familia." };
  if (t.includes("whiplash")) return { genre: "Drama", year: "2014", duration: "1h 46min", desc: "Un joven baterista sueña con la grandeza y se enfrenta a un exigente maestro que lo llevará al límite." };
  if (t.includes("shrek")) return { genre: "Animación", year: "2004", duration: "1h 33min", desc: "Shrek y Fiona viajan al reino de Muy Muy Lejano para conocer a los padres de ella. La aventura apenas comienza." };
  if (t.includes("padrino")) return { genre: "Drama", year: "1972", duration: "2h 55min", desc: "La historia de una familia mafiosa y su patriarca." };
  return { genre: "Cine", year: "", duration: "", desc: "" };
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

  useEffect(() => {
    setVotadas(getVotadas());
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [sRes, fRes] = await Promise.all([fetch("/api/sugerencias"), fetch("/api/funciones")]);
      if (!sRes.ok) throw new Error(await sRes.text());
      if (!fRes.ok) throw new Error(await fRes.text());
      const sData = await sRes.json();
      const fData = await fRes.json();
      setSugerencias(sData.sugerencias);
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
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&h=700&fit=crop" alt="Cine" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] to-transparent" />
        </div>
        <div className="absolute right-0 top-0 hidden h-full w-[55%] lg:block">
          <img src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=600&fit=crop" alt="Proyector" className="h-full w-full object-cover object-left opacity-90" style={{ maskImage: "linear-gradient(to left, black 60%, transparent)" }} />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#050507]" />
          <div className="absolute left-[30%] top-1/2 h-32 w-64 -translate-y-1/2 bg-gradient-to-r from-white/20 to-transparent blur-2xl" style={{ transform: "translateY(-50%) rotate(-5deg)" }} />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black tracking-tight sm:text-7xl lg:text-[84px] lg:leading-none" style={{ fontFamily: "Impact, sans-serif", letterSpacing: "-0.02em" }}>
              VOTA
            </h1>
            <p className="mt-2 text-lg font-bold tracking-[0.2em] text-[#E8B86A] sm:text-xl">TÚ ELIGES QUÉ VEMOS</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Cada voto cuenta. La película más votada será parte de nuestra próxima función.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-[0.15em]">
                <span className="text-[#E8B86A]">▦</span> VOTACIÓN ACTIVA
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-[#E8B86A]">
                <FaClock /> Cierre de votación: 2 días 14 horas
              </span>
            </div>

            {(sugerencias || []).map((s) => {
              const votos = s._count?.votos || 0;
              const pct = totalVotos ? Math.round((votos / totalVotos) * 100) : 0;
              const displayPct = votos === 0 ? 0 : Math.max(5, pct);
              const yaVoto = votadas.includes(s.id);
              const meta = getMeta(s.titulo);
              const poster = getPoster(s.titulo);
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
                        {meta.genre} · {meta.year} · {meta.duration}
                      </p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/60">{meta.desc || s.comentario || ""}</p>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-white/20 text-xl text-white/40">?</div>
            <div>
              <div className="text-xs font-bold tracking-wide text-white">PELÍCULA</div>
              <div className="text-xs font-bold tracking-wide text-white/60">POR DEFINIR</div>
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
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-[#E8B86A] px-6 py-3 text-xs font-bold tracking-wide text-black hover:bg-[#D4A574]">
            RESERVAR CUPO <FaArrowRight className="text-xs" />
          </Link>
        </div>

        <footer className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row">
          <div className="flex items-center gap-6">
            <span>Calle 42 #10-25, Armenia, Colombia</span>
            <span className="flex items-center gap-1">
              <FaWhatsapp className="text-[#25D366]" /> 300 123 4567
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center">◎</span>
            <span className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center">f</span>
            <span className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center">♪</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
