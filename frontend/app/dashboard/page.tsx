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
  FaTicketAlt,
  FaQrcode,
} from "react-icons/fa";

interface Movie {
  titulo: string;
  sinopsis?: string | null;
  posterUrl?: string | null;
}

interface ShowFunction {
  id: string;
  fechaHora: string;
  cupoTotal: number;
  pelicula: Movie;
}

interface ItemBooking {
  tipoEntrada: { nombre: string } | string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Reserva {
  id: string;
  codigo?: string;
  cantidad: number;
  total?: number;
  estado?: string;
  estadoEfectivo?: "PENDIENTE_PAGO" | "CONFIRMADA" | "CANCELADA" | "VENCIDA";
  createdAt: string;
  funcion: ShowFunction;
  items?: ItemBooking[];
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
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      window.location.href = "/";
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

      setFeedback(
        `Reserva para "${cancelingReserva.funcion.pelicula.titulo}" cancelada con éxito.`
      );
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
    <div className="bg-[#070709] min-h-[calc(100vh-64px)] px-4 py-12 text-white sm:px-6 lg:px-8">
      {/* Modal de Confirmación de Cancelación */}
      {cancelingReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85"
            onClick={() => !cancelLoading && setCancelingReserva(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111114] p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
              <FaExclamationTriangle className="text-2xl" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">¿Cancelar esta reserva?</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Estás a punto de cancelar tu reserva de{" "}
              <strong className="text-white">
                {cancelingReserva.cantidad} {cancelingReserva.cantidad === 1 ? "cupo" : "cupos"}
              </strong>{" "}
              para la función de{" "}
              <strong className="text-[#E8B86A]">{cancelingReserva.funcion.pelicula.titulo}</strong>.
            </p>

            <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 text-left">
              <span>
                <strong>Nota:</strong> Al confirmar, tu reserva quedará cancelada y los cupos se liberarán inmediatamente para otros asistentes.
              </span>
            </div>

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
                {cancelLoading ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[960px]">
        {/* Header con bienvenida */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#E8B86A]">MI EXPERIENCIA</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Hola, {user?.nombre || user?.contacto?.split("@")[0] || "Cinéfilo"}
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
          <div className="surface-card p-12 text-center rounded-3xl">
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
          <div className="space-y-5">
            {reservas.map((reserva) => {
              const date = new Date(reserva.funcion.fechaHora);
              const isConfirmada = reserva.estadoEfectivo === "CONFIRMADA";
              const isPendiente = reserva.estadoEfectivo === "PENDIENTE_PAGO";
              const isVencida = reserva.estadoEfectivo === "VENCIDA";
              const isCancelada = reserva.estadoEfectivo === "CANCELADA";

              const diffMs = date.getTime() - Date.now();
              const diffHoras = diffMs / (1000 * 60 * 60);
              const puedeCancelar = (isPendiente || isConfirmada) && diffHoras >= 4;
              const noCancelablePorTiempo = (isPendiente || isConfirmada) && diffHoras < 4 && diffHoras > 0;

              return (
                <article
                  key={reserva.id}
                  className="surface-card overflow-hidden p-6 rounded-3xl transition-colors hover:border-white/20 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        {isConfirmada && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-0.5 text-xs font-bold text-green-400">
                            <FaCheckCircle className="text-[10px]" /> PAGO CONFIRMADO
                          </span>
                        )}
                        {isPendiente && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8B86A]/15 border border-[#E8B86A]/30 px-3 py-0.5 text-xs font-bold text-[#E8B86A] animate-pulse">
                            <FaClock className="text-[10px]" /> PENDIENTE DE PAGO
                          </span>
                        )}
                        {isVencida && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-0.5 text-xs font-bold text-red-400">
                            VENCIDA
                          </span>
                        )}
                        {isCancelada && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-xs font-bold text-white/40">
                            CANCELADA
                          </span>
                        )}

                        {reserva.codigo && (
                          <span className="font-mono text-xs font-bold text-[#E8B86A]">
                            #{reserva.codigo}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2 text-2xl font-black text-white font-serif">
                        {reserva.funcion.pelicula.titulo}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-[#E8B86A]/10 border border-[#E8B86A]/20 px-3 py-1 text-xs font-bold text-[#E8B86A]">
                        <FaTicketAlt className="text-xs" /> {reserva.cantidad}{" "}
                        {reserva.cantidad === 1 ? "cupo" : "cupos"}
                      </span>

                      {puedeCancelar && (
                        <button
                          onClick={() => setCancelingReserva(reserva)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
                          title="Cancelar reserva y liberar cupos"
                        >
                          <FaTrashAlt className="text-[10px]" /> Cancelar
                        </button>
                      )}

                      {noCancelablePorTiempo && (
                        <span
                          className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-white/40 italic"
                          title="Las cancelaciones solo se permiten con mínimo 4 horas de anticipación"
                        >
                          No cancelable (&lt; 4h)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3.5 border border-white/5">
                      <FaCalendarAlt className="text-[#E8B86A] text-lg shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold tracking-wider text-white/40">
                          FECHA Y SALA
                        </span>
                        <span className="font-medium text-white capitalize text-xs">
                          {date.toLocaleDateString("es-CO", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}{" "}
                          · Sala 16 puestos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3.5 border border-white/5">
                      <FaClock className="text-[#E8B86A] text-lg shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold tracking-wider text-white/40">
                          HORA DE INICIO
                        </span>
                        <span className="font-medium text-white text-xs">
                          {date.toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          (Armenia, Quindío)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle de entradas y link a ticket */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
                    <div className="text-white/60">
                      {reserva.items && reserva.items.length > 0 && (
                        <span>
                          {reserva.items
                            .map((it) => {
                              const nombre =
                                typeof it.tipoEntrada === "object"
                                  ? it.tipoEntrada.nombre
                                  : it.tipoEntrada;
                              return `${nombre} ×${it.cantidad}`;
                            })
                            .join(", ")}
                          {" · "}
                        </span>
                      )}
                      <strong className="text-white">
                        Total: ${(reserva.total || 0).toLocaleString("es-CO")}
                      </strong>
                    </div>

                    {reserva.codigo && (
                      <Link
                        href={`/mi-reserva/${reserva.codigo}`}
                        className="inline-flex items-center gap-1.5 font-bold text-[#E8B86A] hover:underline"
                      >
                        <FaQrcode /> Ver Ticket y Detalles →
                      </Link>
                    )}
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
