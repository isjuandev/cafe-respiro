"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaFilm, FaLightbulb, FaTicketAlt, FaUsers, FaChartBar, FaArrowRight } from "react-icons/fa";

interface Suggestion {
  id: string;
  titulo: string;
  estado: string;
  _count: { votos: number };
}

interface Movie {
  id: string;
  titulo: string;
  director?: string | null;
  anio?: number | null;
}

interface ShowFunction {
  id: string;
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados?: number;
  cuposDisponibles?: number;
  pelicula: { titulo: string };
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

export default function AdminDashboardPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [functions, setFunctions] = useState<ShowFunction[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [reservas, setReservas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);
      const [sRes, fRes, pRes] = await Promise.all([
        fetch("/api/admin/sugerencias", { credentials: "include" }),
        fetch("/api/funciones"),
        fetch("/api/admin/peliculas", { credentials: "include" }),
      ]);

      if (!sRes.ok || !fRes.ok || !pRes.ok) {
        throw new Error("No se pudieron cargar las métricas del sistema");
      }

      const [sData, fData, pData] = await Promise.all([
        sRes.json(),
        fRes.json(),
        pRes.json(),
      ]);

      setSuggestions(sData.sugerencias || []);
      setFunctions(fData.funciones || []);
      setMovies(pData.peliculas || []);

      if (fData.funciones?.[0]) {
        const rRes = await fetch(`/api/admin/funciones/${fData.funciones[0].id}/reservas`, {
          credentials: "include",
        });
        if (rRes.ok) {
          const rData = await rRes.json();
          setReservas(rData.totalReservas || rData.reservas?.length || 0);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al cargar métricas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 rounded-2xl bg-white/5" />
          <div className="h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300" role="alert">
        <p className="font-bold">Error al cargar métricas</p>
        <p className="text-xs text-white/60 mt-1">{error}</p>
        <button
          onClick={loadMetrics}
          className="mt-4 rounded-xl bg-[#E8B86A] px-4 py-2 text-xs font-bold text-black uppercase hover:bg-[#D4A574]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const pending = suggestions.filter((item) => item.estado === "PENDIENTE").length;
  const maxVotes = Math.max(...suggestions.map((item) => item._count?.votos || 0), 1);
  const current = functions[0];

  const stats: StatItem[] = [
    { label: "Reservas Activas", value: reservas, icon: FaTicketAlt, href: "/admin/reservas" },
    { label: "Cupos Libres Hoy", value: current?.cuposDisponibles ?? 0, icon: FaUsers, href: "/admin/funciones" },
    { label: "Películas en Catálogo", value: movies.length, icon: FaFilm, href: "/admin/peliculas" },
    {
      label: "Votos Totales",
      value: suggestions.reduce((total, item) => total + (item._count?.votos || 0), 0),
      icon: FaChartBar,
      href: "/admin/votaciones",
    },
    { label: "Sugerencias Pendientes", value: pending, icon: FaLightbulb, href: "/admin/sugerencias" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white font-serif">Resumen Operativo</h2>
        <p className="mt-1 text-xs text-white/60">Estado en tiempo real de la sala boutique, taquilla y cartelera.</p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => {
          const content = (
            <div className="rounded-2xl border border-white/10 bg-[#111114] p-4 transition-colors hover:border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20">
                  <Icon className="text-xs" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-white font-serif tracking-tight">{value}</p>
            </div>
          );

          if (href) {
            return (
              <Link key={label} href={href} className="block">
                {content}
              </Link>
            );
          }
          return <div key={label}>{content}</div>;
        })}
      </div>

      {/* Tablas y Listas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Votos por sugerencia */}
        <section className="rounded-3xl border border-white/10 bg-[#111114] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A] flex items-center gap-2">
              <FaChartBar /> Votaciones de la Comunidad
            </h3>
            <Link href="/admin/votaciones" className="text-[11px] font-bold text-white/60 hover:text-white flex items-center gap-1">
              Gestionar <FaArrowRight className="text-[9px]" />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {suggestions.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl bg-[#16161A] p-3 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-[280px]">{item.titulo}</span>
                  <span className="font-mono font-bold text-[#E8B86A]">{item._count?.votos || 0} votos</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#E8B86A]"
                    style={{
                      width: `${Math.max(4, ((item._count?.votos || 0) / maxVotes) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!suggestions.length && (
              <p className="text-xs text-white/40 italic py-4 text-center">Aún no hay datos de votación registrados.</p>
            )}
          </div>
        </section>

        {/* Próximas Funciones */}
        <section className="rounded-3xl border border-white/10 bg-[#111114] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A] flex items-center gap-2">
              <FaFilm /> Funciones Programadas
            </h3>
            <Link href="/admin/funciones" className="text-[11px] font-bold text-white/60 hover:text-white flex items-center gap-1">
              Ver todas <FaArrowRight className="text-[9px]" />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {functions.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-[#16161A] p-3 border border-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white font-serif">{item.pelicula.titulo}</p>
                  <p className="text-[10px] text-white/50">
                    {new Date(item.fechaHora).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] text-white/40 block">Aforo</span>
                  <span className="text-xs font-mono font-bold text-[#E8B86A]">
                    {item.cuposDisponibles ?? 0}/{item.cupoTotal} disp.
                  </span>
                </div>
              </div>
            ))}
            {!functions.length && (
              <p className="text-xs text-white/40 italic py-4 text-center">No hay funciones programadas.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
