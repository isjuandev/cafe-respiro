"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaArrowRight,
  FaSignOutAlt,
  FaTrashAlt,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

interface Movie {
  titulo: string;
  sinopsis?: string | null;
  posterUrl?: string | null;
}

interface ShowFunction {
  fechaHora: string;
  cupoTotal: number;
  pelicula: Movie;
}

interface Reserva {
  id: string;
  cantidad: number;
  createdAt: string;
  funcion: ShowFunction;
}

interface UserProfile {
  sub?: string;
  contacto?: string;
  nombre?: string;
  role?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Modal para confirmar cancelación
  const [cancelingReserva, setCancelingReserva] = useState<Reserva | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [authRes, resRes] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/mis-reservas", { credentials: "include" }),
      ]);

      if (resRes.status === 401 || resRes.status === 403 || authRes.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!resRes.ok) {
        throw new Error("No se pudieron cargar tus reservas activas");
      }

      if (authRes.ok) {
        const authData = await authRes.json();
        setUser(authData.user || null);
      }

      const resData = await resRes.json();
      setReservas(resData.reservas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al cargar reservas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  async function handleConfirmCancel() {
    if (!cancelingReserva) return;
    try {
      setCancelLoading(true);
      setError(null);

      const res = await fetch(`/api/mis-reservas/${cancelingReserva.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al cancelar la reserva");
      }

      setFeedback(`Reserva para "${cancelingReserva.funcion.pelicula.titulo}" cancelada con éxito. Se liberaron los cupos.`);
      setCancelingReserva(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cancelar reserva");
      setCancelingReserva(null);
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div className="bg-[#050507] min-h-[calc(100vh-64px)] px-4 py-12 text-white sm:px-6 lg:px-8">
      {/* Modal de Confirmación de Cancelación */}
      {cancelingReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !cancelLoading && setCancelingReserva(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-[#141414] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
              <FaExclamationTriangle className="text-2xl" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">¿Cancelar esta reserva?</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Estás a punto de cancelar tu reserva de{" "}
              <strong className="text-white">{cancelingReserva.cantidad} {cancelingReserva.cantidad === 1 ? "cupo" : "cupos"}</strong>{" "}
              para la función de{" "}
              <strong className="text-[#E8B86A]">{cancelingReserva.funcion.pelicula.titulo}</strong>.
              Tus lugares se liberarán inmediatamente en la cartelera.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelingReserva(null)}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {cancelLoading ? "Cancelando..." : "Sí, cancelar reserva"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[900px]">
        {/* Header con bienvenida y botón de Cerrar Sesión */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#E8B86A]">MI EXPERIENCIA</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {user?.contacto ? `Hola, ${user.contacto.split("@")[0]}` : "Mis Reservas"}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {user?.contacto
                ? `Sesión activa como ${user.contacto} · Gestiona tus entradas de cine.`
                : "Tus próximas funciones de cine en Café Respiro, en un solo lugar."}
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-white transition-colors disabled:opacity-50"
          >
            <FaSignOutAlt className="text-sm" />
            {loggingOut ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>

        {feedback && (
          <div className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="shrink-0" />
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4" aria-label="Cargando reservas">
            <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
          </div>
        )}

        {error && (
          <div
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center mb-6"
            role="alert"
          >
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && reservas && reservas.length === 0 && (
          <div className="surface-card p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#E8B86A]">
              <FaCalendarAlt className="text-2xl" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">No tienes reservas activas</h3>
            <p className="mt-2 text-sm text-white/50">
              Explora la cartelera y asegura tu cupo para las próximas proyecciones a las 7:00 PM.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E8B86A] px-6 py-3 text-sm font-bold text-black hover:bg-[#D4A574]"
            >
              Explorar cartelera <FaArrowRight className="text-xs" />
            </Link>
          </div>
        )}

        {!loading && reservas && reservas.length > 0 && (
          <div className="space-y-4">
            {reservas.map((reserva) => {
              const date = new Date(reserva.funcion.fechaHora);
              return (
                <article
                  key={reserva.id}
                  className="surface-card overflow-hidden p-6 transition-colors hover:border-white/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#E8B86A]">
                        ● RESERVA CONFIRMADA
                      </span>
                      <h2 className="mt-1 text-2xl font-bold text-white">
                        {reserva.funcion.pelicula.titulo}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-[#6B8E6B]/20 border border-[#6B8E6B]/30 px-3 py-1 text-xs font-bold text-[#9BC49B]">
                        <FaUsers className="text-xs" /> {reserva.cantidad}{" "}
                        {reserva.cantidad === 1 ? "persona" : "personas"}
                      </span>

                      <button
                        onClick={() => setCancelingReserva(reserva)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
                        title="Cancelar reserva y liberar cupos"
                      >
                        <FaTrashAlt className="text-[10px]" /> Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                      <FaCalendarAlt className="text-[#E8B86A] text-lg shrink-0" />
                      <div>
                        <span className="block text-[11px] font-bold tracking-wider text-white/40">
                          FECHA
                        </span>
                        <span className="font-medium text-white capitalize">
                          {date.toLocaleDateString("es-CO", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                      <FaClock className="text-[#E8B86A] text-lg shrink-0" />
                      <div>
                        <span className="block text-[11px] font-bold tracking-wider text-white/40">
                          HORA
                        </span>
                        <span className="font-medium text-white">
                          {date.toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          (Hora Colombia)
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
