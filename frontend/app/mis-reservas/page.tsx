"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaSearch,
  FaTicketAlt,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaTrashAlt,
  FaExclamationTriangle,
  FaQrcode,
} from "react-icons/fa";

interface ItemReserva {
  tipoEntrada: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface ReservaItem {
  id: string;
  codigo: string;
  estado: "CONFIRMADA" | "PENDIENTE_PAGO" | "VENCIDA" | "CANCELADA";
  estadoOriginal: string;
  expiraEn: string;
  nombre: string;
  contacto: string;
  email?: string | null;
  cantidad: number;
  total: number;
  confirmadoEn?: string | null;
  createdAt: string;
  items: ItemReserva[];
  funcion: {
    id: string;
    fechaHora: string;
    pelicula: {
      titulo: string;
      posterUrl?: string | null;
      duracionMin?: number | null;
    };
  };
}

export default function MisReservasPublicPage() {
  const [criterio, setCriterio] = useState("");
  const [reservas, setReservas] = useState<ReservaItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para cancelar reserva desde el listado
  const [cancelingReserva, setCancelingReserva] = useState<ReservaItem | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = criterio.trim();
    if (!query || query.length < 3) {
      setError("Por favor ingresa al menos 3 caracteres (ej: código CIN- o teléfono / correo)");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCancelFeedback(null);
      setSearched(true);

      const res = await fetch(`/api/reservas/consultar?criterio=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al buscar reservas");
      }

      setReservas(data.reservas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al buscar reservas");
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelingReserva) return;
    try {
      setCanceling(true);
      setError(null);

      const res = await fetch(`/api/reservas/${cancelingReserva.codigo}/cancelar`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al cancelar la reserva");
      }

      setCancelFeedback(
        `Reserva #${cancelingReserva.codigo} para "${cancelingReserva.funcion.pelicula.titulo}" cancelada con éxito. Cupos liberados.`
      );
      setCancelingReserva(null);

      // Actualizar estado local de la reserva cancelada
      setReservas((prev) =>
        prev
          ? prev.map((r) =>
              r.id === cancelingReserva.id ? { ...r, estado: "CANCELADA" } : r
            )
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar reserva");
      setCancelingReserva(null);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#070709] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Cabecera Principal */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#E8B86A]">
            TAQUILLA DIGITAL
          </span>
          <h1 className="text-3xl font-black sm:text-4xl font-serif">
            Consulta tus Reservas
          </h1>
          <p className="text-sm text-white/60 max-w-lg mx-auto leading-relaxed">
            Ingresa tu código de reserva (ej: <strong className="text-white font-mono">CIN-TN56W</strong>)
            o el número de teléfono / correo con el que realizaste la reserva.
          </p>
        </div>

        {/* Formulario de Búsqueda */}
        <form
          onSubmit={handleSearch}
          className="rounded-3xl border border-white/10 bg-[#111114] p-4 sm:p-6 shadow-2xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
              <input
                type="text"
                value={criterio}
                onChange={(e) => setCriterio(e.target.value)}
                placeholder="Código CIN-... o teléfono o correo de reserva"
                className="w-full rounded-2xl border border-white/10 bg-[#16161A] pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-[#E8B86A] focus:outline-none focus:ring-1 focus:ring-[#E8B86A]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E8B86A] px-6 py-3.5 text-sm font-bold text-black hover:bg-[#D4A574] transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? (
                "Buscando..."
              ) : (
                <>
                  <FaSearch className="text-xs" /> Buscar Reservas
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-white/40 text-center">
            No necesitas contraseña para consultar el estado de tus entradas.
          </p>
        </form>

        {/* Feedback Messages */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300 text-center"
          >
            {error}
          </div>
        )}

        {cancelFeedback && (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-xs font-medium text-green-300">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="shrink-0 text-sm" />
              <span>{cancelFeedback}</span>
            </div>
            <button
              onClick={() => setCancelFeedback(null)}
              className="text-xs font-bold hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Resultados de Búsqueda */}
        {searched && !loading && (
          <div className="space-y-4">
            {reservas && reservas.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#111114] p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[#E8B86A]">
                  <FaTicketAlt className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white">No encontramos reservas</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
                  No se encontraron reservas con el criterio ingresado. Verifica que el código, teléfono o correo coincida exactamente con el que usaste al reservar.
                </p>
              </div>
            ) : (
              reservas?.map((reserva) => {
                const date = new Date(reserva.funcion.fechaHora);
                const isConfirmada = reserva.estado === "CONFIRMADA";
                const isPendiente = reserva.estado === "PENDIENTE_PAGO";
                const isVencida = reserva.estado === "VENCIDA";
                const isCancelada = reserva.estado === "CANCELADA";

                const diffMs = date.getTime() - Date.now();
                const diffHoras = diffMs / (1000 * 60 * 60);
                const puedeCancelar = (isPendiente || isConfirmada) && diffHoras >= 4;
                const noCancelable = (isPendiente || isConfirmada) && diffHoras < 4 && diffHoras > 0;

                return (
                  <article
                    key={reserva.id}
                    className="rounded-3xl border border-white/10 bg-[#111114] p-6 space-y-4 transition-colors hover:border-white/20 shadow-lg"
                  >
                    {/* Header de la Tarjeta */}
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
                              <FaTimesCircle className="text-[10px]" /> VENCIDA
                            </span>
                          )}
                          {isCancelada && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-xs font-bold text-white/40">
                              <FaTimesCircle className="text-[10px]" /> CANCELADA
                            </span>
                          )}

                          <span className="font-mono text-xs font-bold text-[#E8B86A]">
                            #{reserva.codigo}
                          </span>
                        </div>

                        <h2 className="mt-2 text-2xl font-black text-white font-serif">
                          {reserva.funcion.pelicula.titulo}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2.5">
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

                        {noCancelable && (
                          <span
                            className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-white/40 italic"
                            title="Cancelaciones solo con mínimo 4 horas de anticipación"
                          >
                            No cancelable (&lt; 4h)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fecha y Sala */}
                    <div className="grid gap-3 sm:grid-cols-2 text-xs text-white/70">
                      <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.02] p-3 border border-white/5">
                        <FaCalendarAlt className="text-[#E8B86A] text-base shrink-0" />
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-white/40">
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

                      <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.02] p-3 border border-white/5">
                        <FaClock className="text-[#E8B86A] text-base shrink-0" />
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-white/40">
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

                    {/* Desglose y Acceso al Ticket */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
                      <div className="text-white/60">
                        {reserva.items && reserva.items.length > 0 && (
                          <span>
                            {reserva.items
                              .map((it) => `${it.tipoEntrada} ×${it.cantidad}`)
                              .join(", ")}{" "}
                            ·{" "}
                          </span>
                        )}
                        <strong className="text-white">
                          Total: ${(reserva.total || 0).toLocaleString("es-CO")}
                        </strong>
                      </div>

                      <Link
                        href={`/mi-reserva/${reserva.codigo}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#E8B86A]/10 border border-[#E8B86A]/30 px-4 py-2 font-bold text-[#E8B86A] hover:bg-[#E8B86A] hover:text-black transition-all"
                      >
                        <FaQrcode /> Ver Ticket y Detalles <FaArrowRight className="text-xs" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* Acceso a cuenta para usuarios registrados */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-white/50 space-y-2">
          <p>
            ¿Tienes una cuenta registrada con contraseña en Café Respiro?
          </p>
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-bold text-[#E8B86A] hover:underline"
            >
              Iniciar sesión en mi cuenta →
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Cancelación */}
      {cancelingReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111114] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
              <FaExclamationTriangle className="text-2xl" />
            </div>

            <h3 className="text-xl font-bold text-white">¿Cancelar esta reserva?</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Estás a punto de cancelar tu reserva de{" "}
              <strong className="text-white">
                {cancelingReserva.cantidad} {cancelingReserva.cantidad === 1 ? "cupo" : "cupos"}
              </strong>{" "}
              para la función de{" "}
              <strong className="text-[#E8B86A]">{cancelingReserva.funcion.pelicula.titulo}</strong>.
            </p>

            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 text-left">
              <span>
                <strong>Nota:</strong> Al confirmar, tu reserva #{cancelingReserva.codigo} quedará cancelada y los cupos se liberarán inmediatamente.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={canceling}
                onClick={() => setCancelingReserva(null)}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={canceling}
                onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {canceling ? "Cancelando..." : "Sí, Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
