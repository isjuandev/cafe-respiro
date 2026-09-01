"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaStar,
  FaUsers,
  FaArrowRight,
  FaClock,
  FaLightbulb,
  FaVoteYea,
  FaCalendarAlt,
  FaLock,
  FaCheckCircle,
  FaCoffee,
  FaFilm,
  FaUtensils,
  FaChevronRight,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaGamepad,
} from "react-icons/fa";

interface Pelicula {
  id: string;
  titulo: string;
  director?: string | null;
  anio?: number | null;
  genero?: string | null;
  duracionMin?: number | null;
  sinopsis?: string | null;
  posterUrl?: string | null;
}

interface Funcion {
  id: string;
  peliculaId: string;
  pelicula: Pelicula;
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  createdAt: string;
}

interface VotacionActiva {
  id: string;
  activa: boolean;
  cierraAt?: string;
  sugerencias?: Array<{
    id: string;
    titulo: string;
    director?: string | null;
    genero?: string | null;
    posterUrl?: string | null;
    _count?: { votos: number };
  }>;
}

interface AuthUser {
  sub?: string;
  contacto?: string;
  nombre?: string;
  role?: string;
}

function formatHeroDate(iso: string) {
  const d = new Date(iso);
  const dayName = d.toLocaleDateString("es-CO", { weekday: "long" }).toUpperCase();
  const dayNum = d.getDate();
  const month = d.toLocaleDateString("es-CO", { month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${dayName} ${dayNum} ${month} · ${time}`;
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("es-CO", { weekday: "short" }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString("es-CO", { month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return {
    badge: `${weekday} ${day} ${month}`,
    time,
  };
}

function getDurationLabel(min?: number | null) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m > 0 ? `${m}m` : ""}`;
}

export default function HomePage() {
  const [funciones, setFunciones] = useState<Funcion[] | null>(null);
  const [votacion, setVotacion] = useState<VotacionActiva | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Selector de película activa en el Hero
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);

  // Estados de reserva interactiva
  const [reservaCantidad, setReservaCantidad] = useState<Record<string, number>>({});
  const [reservaLoading, setReservaLoading] = useState<Record<string, boolean>>({});
  const [reservaError, setReservaError] = useState<Record<string, string | null>>({});
  const [reservaSuccess, setReservaSuccess] = useState<Record<string, string | null>>({});
  const [expandedReserva, setExpandedReserva] = useState<string | null>(null);

  // Modal de inicio de sesión requerido
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetPeliculaTitle, setTargetPeliculaTitle] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [funcRes, authRes, votRes] = await Promise.all([
        fetch("/api/funciones"),
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/votaciones/activa"),
      ]);

      if (!funcRes.ok) throw new Error(`Error al cargar la cartelera`);
      const funcData = await funcRes.json();
      setFunciones(funcData.funciones || []);

      if (authRes.ok) {
        const authData = await authRes.json();
        setUser(authData.user || null);
      } else {
        setUser(null);
      }

      if (votRes.ok) {
        const votData = await votRes.json();
        setVotacion(votData.activa ? votData : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenReserva(funcion: Funcion) {
    if (!user) {
      setTargetPeliculaTitle(funcion.pelicula.titulo);
      setShowAuthModal(true);
      return;
    }
    setExpandedReserva(funcion.id);
  }

  async function handleReservar(funcionId: string) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const cantidad = reservaCantidad[funcionId] || 1;
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) {
      setReservaError((p) => ({ ...p, [funcionId]: "La cantidad debe ser entre 1 y 10 personas" }));
      return;
    }

    try {
      setReservaLoading((p) => ({ ...p, [funcionId]: true }));
      setReservaError((p) => ({ ...p, [funcionId]: null }));
      setReservaSuccess((p) => ({ ...p, [funcionId]: null }));

      const res = await fetch(`/api/funciones/${funcionId}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cantidad }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || `Error al procesar reserva`;
        throw new Error(msg);
      }

      setReservaSuccess((p) => ({
        ...p,
        [funcionId]: `¡Reserva confirmada! Aseguraste tus cupos en Cine Café Respiro.`,
      }));
      setExpandedReserva(null);
      await loadData();
    } catch (err) {
      setReservaError((p) => ({ ...p, [funcionId]: err instanceof Error ? err.message : "Error" }));
    } finally {
      setReservaLoading((p) => ({ ...p, [funcionId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] px-4 py-12">
        <div className="mx-auto max-w-[1280px] space-y-8 animate-pulse">
          <div className="h-[460px] rounded-3xl bg-white/5 border border-white/5" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/5 border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 max-w-md mx-auto">
          <p className="font-bold text-red-400">No se pudo cargar la cartelera</p>
          <p className="mt-2 text-xs text-white/60">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-xl bg-[#E8B86A] px-5 py-2 text-xs font-bold text-black hover:bg-[#D4A574]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const hasFunciones = Boolean(funciones && funciones.length > 0);
  const heroFuncion: Funcion | null =
    hasFunciones && funciones ? funciones[selectedHeroIndex] || funciones[0] : null;

  const heroId = heroFuncion?.id || "hero-placeholder";
  const heroPelicula = heroFuncion?.pelicula;
  const heroPoster =
    heroPelicula?.posterUrl ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop";
  const heroCuposDisponibles = heroFuncion?.cuposDisponibles ?? 0;
  const heroCuposOcupados = heroFuncion?.cuposOcupados ?? 0;
  const heroCupoTotal = heroFuncion?.cupoTotal ?? 16;
  const heroLleno = heroCuposDisponibles === 0;

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* MODAL: Inicio de Sesión Requerido para Reservas */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[#E8B86A]/30 bg-[#121215] p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E8B86A]/30 bg-[#E8B86A]/10 text-[#E8B86A]">
              <FaLock className="text-2xl" />
            </div>

            <h3 className="mt-4 text-xl font-black text-white">Inicia sesión para reservar</h3>
            <p className="mt-2 text-xs text-white/70 leading-relaxed">
              Café Respiro cuenta con una sala boutique de <strong>16 sillas exclusivas</strong> en Armenia. Para asegurar tu puesto en{" "}
              <strong className="text-[#E8B86A]">{targetPeliculaTitle || "la función"}</strong>, inicia sesión o crea tu cuenta en 30 segundos.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/login"
                className="w-full rounded-xl bg-[#E8B86A] py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D4A574] transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="w-full rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
              >
                Crear Cuenta Nueva
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="mt-1 text-xs text-white/40 hover:text-white"
              >
                Volver a la cartelera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO CINEMATOGRÁFICO SPLIT */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-[#101015] via-[#09090c] to-[#070709] py-10 lg:py-16">
        {/* Glow de fondo cálido */}
        <div
          className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full opacity-15 blur-[120px]"
          style={{ background: "#E8B86A" }}
        />

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {heroFuncion && heroPelicula ? (
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Columna Izquierda: Información de la Función y Reserva */}
              <div className="space-y-6 lg:col-span-7">
                {/* Píldora de estado de función */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8B86A]/30 bg-[#E8B86A]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#E8B86A]">
                  <span className="h-2 w-2 rounded-full bg-[#E8B86A] animate-pulse" />
                  <span>{formatHeroDate(heroFuncion.fechaHora)}</span>
                </div>

                {/* Título y Director */}
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-serif">
                    {heroPelicula.titulo}
                  </h1>
                  {heroPelicula.director && (
                    <p className="mt-2 text-sm sm:text-base font-medium text-white/70">
                      Dirigida por <span className="text-white font-semibold">{heroPelicula.director}</span>
                    </p>
                  )}
                </div>

                {/* Badges de Metadatos */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {heroPelicula.anio && (
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-white/90">
                      {heroPelicula.anio}
                    </span>
                  )}
                  {heroPelicula.duracionMin && (
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-white/90">
                      {getDurationLabel(heroPelicula.duracionMin)}
                    </span>
                  )}
                  {heroPelicula.genero && (
                    <span className="rounded-lg border border-[#E8B86A]/20 bg-[#E8B86A]/10 px-2.5 py-1 font-semibold text-[#E8B86A]">
                      {heroPelicula.genero}
                    </span>
                  )}
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-white/90">
                    <FaStar className="text-[#E8B86A] text-[10px]" />
                    <span>4.9</span>
                  </div>
                </div>

                {/* Sinopsis */}
                {heroPelicula.sinopsis && (
                  <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-white/70">
                    {heroPelicula.sinopsis}
                  </p>
                )}

                {/* Medidor de Aforo en Tiempo Real (16 Cupos) */}
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white/70 flex items-center gap-1.5">
                      <FaUsers className="text-[#E8B86A]" /> Aforo de la Sala (16 sillas boutique)
                    </span>
                    <span className={heroLleno ? "text-red-400 font-bold" : "text-[#E8B86A] font-bold"}>
                      {heroLleno ? "SALA LLENA (0 de 16 disponibles)" : `${heroCuposDisponibles} de ${heroCupoTotal} cupos disponibles`}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        heroLleno ? "bg-red-500" : "bg-[#E8B86A]"
                      }`}
                      style={{ width: `${Math.min(100, (heroCuposOcupados / heroCupoTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Feedback de reserva */}
                {reservaSuccess[heroId] && (
                  <div className="max-w-md flex items-center gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 p-3.5 text-xs text-green-300">
                    <FaCheckCircle className="text-base shrink-0" />
                    <span className="flex-1">{reservaSuccess[heroId]}</span>
                    <Link href="/dashboard" className="underline font-bold text-white hover:text-[#E8B86A]">
                      Ver Reserva →
                    </Link>
                  </div>
                )}
                {reservaError[heroId] && (
                  <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {reservaError[heroId]}
                  </div>
                )}

                {/* Control de Reserva Expandible */}
                {expandedReserva === heroId ? (
                  <div className="max-w-md rounded-2xl border border-[#E8B86A]/40 bg-[#121215] p-4 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                      <span className="font-bold text-[#E8B86A]">
                        SELECCIONA TUS CUPOS ({heroCuposDisponibles} disponibles de {heroCupoTotal}):
                      </span>
                      <span className="text-white/50">{user?.contacto}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/80">
                        Personas (Máx. {heroCuposDisponibles} disponibles):
                      </label>
                      <select
                        value={reservaCantidad[heroId] || 1}
                        onChange={(e) =>
                          setReservaCantidad((p) => ({
                            ...p,
                            [heroId]: parseInt(e.target.value, 10),
                          }))
                        }
                        className="control-dark rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      >
                        {Array.from(
                          { length: Math.min(10, heroCuposDisponibles) },
                          (_, i) => i + 1
                        ).map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? "persona" : "personas"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setExpandedReserva(null)}
                        className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/5"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleReservar(heroId)}
                        disabled={!!reservaLoading[heroId]}
                        className="flex-1 rounded-xl bg-[#E8B86A] py-2.5 text-xs font-bold text-black hover:bg-[#D4A574] disabled:opacity-50"
                      >
                        {reservaLoading[heroId] ? "Confirmando..." : `Confirmar (${reservaCantidad[heroId] || 1} de ${heroCuposDisponibles})`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleOpenReserva(heroFuncion)}
                      disabled={heroLleno}
                      className="inline-flex items-center gap-2.5 rounded-2xl bg-[#E8B86A] px-7 py-3.5 text-xs sm:text-sm font-black tracking-wider text-black uppercase transition-all duration-200 hover:bg-[#D4A574] hover:shadow-lg hover:shadow-[#E8B86A]/20 disabled:bg-white/10 disabled:text-white/30"
                    >
                      {heroLleno ? "SALA COMPLETA (0/16)" : `RESERVAR CUPO (${heroCuposDisponibles} DE ${heroCupoTotal} DISPONIBLES)`}
                      <FaArrowRight className="text-xs" />
                    </button>

                    <Link
                      href="/menu"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 transition-colors"
                    >
                      <FaCoffee className="text-[#E8B86A]" /> Ver Menú & Restaurante
                    </Link>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Póster Cinemático Nítido */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative group w-full max-w-[320px] sm:max-w-[340px] rounded-3xl overflow-hidden border border-[#E8B86A]/30 shadow-2xl glow-gold bg-black">
                  <div className="aspect-[2/3] w-full relative">
                    <img
                      src={heroPoster}
                      alt={heroPelicula.titulo}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="rounded-full bg-black/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur border border-white/10">
                        🎟️ Sala Boutique · 16 Sillas
                      </span>
                      <span className="rounded-full bg-[#E8B86A] px-2.5 py-1 text-[11px] font-bold text-black">
                        7:00 PM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switcher interactivo de funciones */}
                {funciones && funciones.length > 1 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-[340px]">
                    {funciones.map((f, idx) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedHeroIndex(idx)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                          selectedHeroIndex === idx
                            ? "bg-[#E8B86A] text-black"
                            : "bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {f.pelicula.titulo.split(":")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <FaFilm className="mx-auto text-5xl text-[#E8B86A]/40 mb-4" />
              <h2 className="text-3xl font-black text-white">NUEVAS FUNCIONES PRÓXIMAMENTE</h2>
              <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
                Estamos programando la cartelera de Cine Café Respiro Armenia.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. AGENDA DE CINE / PRÓXIMAS FUNCIONES (CARDS VERTICALES 2:3) */}
      <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#E8B86A]">
              <FaCalendarAlt /> CARTELERA DE CINE
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white font-serif">
              Elige tu Función en Armenia
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Calle 9 # 13-29 Armenia, Quindío · Funciones 7:00 PM (16 puestos).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/50">
            <FaClock className="text-[#E8B86A]" /> Ingreso hasta 25 min tras el inicio
          </div>
        </div>

        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {funciones && funciones.length > 0 ? (
            funciones.map((f) => {
              const p = f.pelicula;
              const dateObj = formatShortDate(f.fechaHora);
              const poster =
                p.posterUrl ||
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop";
              const lleno = f.cuposDisponibles === 0;
              const fid = f.id;

              return (
                <div
                  key={fid}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121215] transition-all duration-300 hover:border-[#E8B86A]/40 hover:shadow-2xl hover:shadow-[#E8B86A]/10"
                >
                  {/* Póster Vertical Cinemático */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                    <img
                      src={poster}
                      alt={p.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/40" />

                    {/* Badge de fecha arriba */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur border border-white/10">
                        {dateObj.badge}
                      </span>
                      <span className="rounded-lg bg-[#E8B86A] px-2 py-0.5 text-[10px] font-black text-black">
                        {dateObj.time}
                      </span>
                    </div>

                    {/* Badge de aforo sobre el poster */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between text-[10px] font-bold rounded-lg bg-black/75 px-2.5 py-1 backdrop-blur border border-white/10">
                        <span className="flex items-center gap-1 text-white/80">
                          <FaUsers className="text-[#E8B86A]" /> Aforo
                        </span>
                        <span className={lleno ? "text-red-400" : "text-[#E8B86A]"}>
                          {lleno ? "SALA LLENA (0/16)" : `${f.cuposDisponibles} de ${f.cupoTotal ?? 16} disponibles`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido de la Card */}
                  <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                    <div>
                      <h3
                        className="text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-[#E8B86A] transition-colors font-serif"
                        title={p.titulo}
                      >
                        {p.titulo}
                      </h3>
                      <p className="mt-0.5 text-xs text-white/60 line-clamp-1">
                        {p.director || "Cine de autor"} {p.duracionMin ? `· ${getDurationLabel(p.duracionMin)}` : ""}
                      </p>
                      {p.genero && (
                        <span className="mt-2 inline-block rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-[#E8B86A]">
                          {p.genero}
                        </span>
                      )}
                    </div>

                    {/* Selector de reserva / Feedback */}
                    <div className="pt-2 border-t border-white/5">
                      {reservaSuccess[fid] && (
                        <div className="mb-2 rounded-lg bg-green-500/10 p-2 text-[11px] text-green-300">
                          {reservaSuccess[fid]}
                        </div>
                      )}
                      {reservaError[fid] && (
                        <div className="mb-2 rounded-lg bg-red-500/10 p-2 text-[11px] text-red-300">
                          {reservaError[fid]}
                        </div>
                      )}

                      {expandedReserva === fid ? (
                        <div className="space-y-2 rounded-xl border border-[#E8B86A]/30 bg-black/60 p-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/70">
                              Cupos ({f.cuposDisponibles} disp. de {f.cupoTotal ?? 16}):
                            </span>
                            <select
                              value={reservaCantidad[fid] || 1}
                              onChange={(e) =>
                                setReservaCantidad((prev) => ({
                                  ...prev,
                                  [fid]: parseInt(e.target.value, 10),
                                }))
                              }
                              className="control-dark rounded px-2 py-1 text-xs"
                            >
                              {Array.from(
                                { length: Math.min(10, f.cuposDisponibles) },
                                (_, i) => i + 1
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num} {num === 1 ? "cupo" : "cupos"}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setExpandedReserva(null)}
                              className="flex-1 rounded-lg border border-white/10 py-1 text-[11px] font-bold text-white hover:bg-white/5"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleReservar(fid)}
                              disabled={!!reservaLoading[fid]}
                              className="flex-1 rounded-lg bg-[#E8B86A] py-1 text-[11px] font-bold text-black hover:bg-[#D4A574] disabled:opacity-50"
                            >
                              {reservaLoading[fid] ? "..." : `Confirmar (${reservaCantidad[fid] || 1})`}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReserva(f)}
                          disabled={lleno}
                          className={`w-full rounded-xl py-2 text-xs font-bold tracking-wide uppercase transition-colors ${
                            lleno
                              ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                              : "bg-[#E8B86A]/10 border border-[#E8B86A]/30 text-[#E8B86A] hover:bg-[#E8B86A] hover:text-black"
                          }`}
                        >
                          {lleno ? "Sala Llena (0/16)" : `Reservar (${f.cuposDisponibles} de ${f.cupoTotal ?? 16} disp.)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-xs text-white/40">
              No hay más funciones programadas por ahora.
            </div>
          )}
        </div>
      </section>

      {/* 3. CINECLUB & VOTACIONES COMUNITARIAS */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#E8B86A]/20 bg-gradient-to-r from-[#181512] via-[#121115] to-[#0d0d12] p-6 sm:p-10 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E8B86A]/10 border border-[#E8B86A]/30 px-3 py-1 text-[11px] font-bold text-[#E8B86A]">
                <FaVoteYea /> CINECLUB COMUNITARIO DE ARMENIA
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
                Tú decides qué películas proyectamos en Café Respiro
              </h2>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-xl">
                La cartelera se programa junto a nuestra comunidad cinéfila. Vota por tu película favorita sin necesidad de contraseña o propón nuevos títulos para la sala.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/votar"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E8B86A] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#D4A574] transition-colors"
                >
                  <FaVoteYea /> Votar en la Ronda Actual
                </Link>
                <Link
                  href="/sugerencias"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                >
                  <FaLightbulb className="text-[#E8B86A]" /> Sugerir una Película
                </Link>
              </div>
            </div>

            {/* Tarjetas de previsualización de votaciones */}
            <div className="lg:col-span-5">
              {votacion?.sugerencias && votacion.sugerencias.length > 0 ? (
                <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white/60 border-b border-white/10 pb-2">
                    <span>En votación ahora</span>
                    <span className="text-[#E8B86A]">Votos acumulados</span>
                  </div>
                  {votacion.sugerencias.slice(0, 3).map((sug) => (
                    <div
                      key={sug.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {sug.posterUrl && (
                          <img
                            src={sug.posterUrl}
                            alt=""
                            className="h-10 w-7 object-cover rounded shrink-0 border border-white/10"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate font-serif">{sug.titulo}</p>
                          <p className="text-[10px] text-white/50 truncate">{sug.director || sug.genero}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#E8B86A]/15 border border-[#E8B86A]/30 px-2.5 py-0.5 text-xs font-bold text-[#E8B86A]">
                        {sug._count?.votos || 0} votos
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/votar"
                    className="block text-center text-xs font-bold text-[#E8B86A] pt-1 hover:underline"
                  >
                    Ver todas las opciones y votar →
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-white/60">
                  <p>Pronto se abrirá la siguiente ronda de votaciones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE DE CAFÉ, RESTAURANTE & JUEGOS DE MESA */}
      <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
            UNA PAUSA CON PLAN EN ARMENIA
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white font-serif">
            Cine, Café, Gastronomía & Juegos de Mesa
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/60">
            Respiro es el punto de encuentro en la Calle 9 # 13-29 Armenia para disfrutar café de especialidad de origen, gastronomía artesanal, ludoteca y cine íntimo.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Tarjeta 1: Café */}
          <div className="group rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-4 hover:border-[#E8B86A]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20">
              <FaCoffee className="text-xl" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">Café de Origen Quindío</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Extracciones artesanales en V60, Chemex, Aeropress, Espresso y Cold Brew con 18 horas de infusión lenta.
            </p>
          </div>

          {/* Tarjeta 2: Gastronomía & Juegos */}
          <div className="group rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-4 hover:border-[#E8B86A]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20">
              <FaGamepad className="text-xl" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">Restaurante & Juegos de Mesa</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Tarta de queso vasca, sándwiches de masa madre, empanaditas horneadas y variedad de juegos de mesa para compartir.
            </p>
          </div>

          {/* Tarjeta 3: Sala Boutique */}
          <div className="group rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-4 hover:border-[#E8B86A]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20">
              <FaFilm className="text-xl" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">Sala Única de 16 Sillas</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              El cine se disfruta mejor de cerca. Una sola función al día a las 7:00 PM con butacas cómodas y cineforo.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8B86A]/40 bg-[#E8B86A]/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#E8B86A] hover:bg-[#E8B86A] hover:text-black transition-colors"
          >
            Explorar Menú Completo <FaChevronRight className="text-[10px]" />
          </Link>
          <a
            href="https://wa.me/573019761947"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
          >
            <FaWhatsapp className="text-green-400" /> WhatsApp Directo
          </a>
        </div>
      </section>

      {/* 5. CÓMO FUNCIONA */}
      <section className="border-t border-white/5 bg-[#050507] py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
              GUÍA DE VISITA
            </span>
            <h2 className="mt-1 text-2xl font-black text-white font-serif">¿Cómo vivir la experiencia Respiro?</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center space-y-2">
              <span className="inline-block rounded-full bg-[#E8B86A]/10 px-3 py-1 text-xs font-bold text-[#E8B86A]">
                Paso 1
              </span>
              <h4 className="text-sm font-bold text-white font-serif">Elige tu película y reserva</h4>
              <p className="text-xs text-white/50">
                Selecciona la función a las 7:00 PM y asegura tu puesto en nuestra sala boutique de 16 cupos.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center space-y-2">
              <span className="inline-block rounded-full bg-[#E8B86A]/10 px-3 py-1 text-xs font-bold text-[#E8B86A]">
                Paso 2
              </span>
              <h4 className="text-sm font-bold text-white font-serif">Llega a partir de las 3:00 PM</h4>
              <p className="text-xs text-white/50">
                Juega unas partidas de juegos de mesa, disfruta un café filtrado del Quindío y pide tu picoteo.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center space-y-2">
              <span className="inline-block rounded-full bg-[#E8B86A]/10 px-3 py-1 text-xs font-bold text-[#E8B86A]">
                Paso 3
              </span>
              <h4 className="text-sm font-bold text-white font-serif">Disfruta la función (7:00 PM)</h4>
              <p className="text-xs text-white/50">
                Ingreso hasta 25 min tras el inicio. Vive la película en formato íntimo y participa en el cineforo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
