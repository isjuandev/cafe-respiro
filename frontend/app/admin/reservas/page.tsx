"use client";

import { useEffect, useState } from "react";
import { FaCheckCircle, FaClock, FaTimesCircle, FaTicketAlt, FaSyncAlt } from "react-icons/fa";

interface Show {
  id: string;
  fechaHora: string;
  cupoTotal: number;
  cuposDisponibles?: number;
  cuposOcupados?: number;
  pelicula: { titulo: string };
}

interface ItemBooking {
  tipoEntrada: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Booking {
  id: string;
  codigo: string;
  nombre: string;
  contacto: string;
  email?: string | null;
  cantidad: number;
  total: number;
  estado: string;
  estadoEfectivo: "PENDIENTE_PAGO" | "CONFIRMADA" | "CANCELADA" | "VENCIDA";
  expiraEn: string;
  confirmadoEn?: string | null;
  createdAt: string;
  items: ItemBooking[];
}

export default function AdminReservationsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [selected, setSelected] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  async function fetchShows() {
    try {
      setLoading(true);
      const res = await fetch("/api/funciones");
      if (!res.ok) throw new Error("No se pudieron cargar las funciones");
      const data = await res.json();
      const funciones: Show[] = data.funciones || [];
      setShows(funciones);
      if (funciones.length > 0 && !selected) {
        setSelected(funciones[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookings(showId: string) {
    try {
      setBookings(null);
      const res = await fetch(`/api/admin/funciones/${showId}/reservas`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("No se pudieron cargar las reservas");
      const data = await res.json();
      setBookings(data.reservas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar reservas");
    }
  }

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (selected) {
      fetchBookings(selected);
    } else {
      setBookings([]);
    }
  }, [selected]);

  async function handleConfirmarPago(bookingId: string) {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      const res = await fetch(`/api/admin/reservas/${bookingId}/confirmar-pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al confirmar el pago");
      }

      if (selected) {
        await fetchBookings(selected);
        await fetchShows();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al procesar la acción");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white/5" />;
  }

  const currentShow = shows.find((item) => item.id === selected);
  const totalPersonas =
    bookings
      ?.filter((b) => b.estadoEfectivo === "CONFIRMADA" || b.estadoEfectivo === "PENDIENTE_PAGO")
      .reduce((acc, curr) => acc + curr.cantidad, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white font-serif">Control de Taquilla y Pagos</h2>
          <p className="mt-1 text-xs text-white/60">
            Valida transferencias manuales, audita comprobantes y confirma cupos por función.
          </p>
        </div>
        <button
          onClick={() => selected && fetchBookings(selected)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111114] px-4 py-2 text-xs font-bold text-white hover:bg-[#16161A] transition-colors"
        >
          <FaSyncAlt className="text-xs text-[#E8B86A]" /> Recargar
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-300 border border-red-500/20"
        >
          {error}
        </div>
      )}

      {!shows.length && !error && (
        <div className="rounded-3xl border border-white/10 bg-[#111114] p-8 text-center text-xs text-white/60">
          No hay funciones programadas disponibles.
        </div>
      )}

      {shows.length > 0 && (
        <>
          <div className="rounded-3xl border border-white/10 bg-[#111114] p-5">
            <label htmlFor="reservation-show" className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Seleccionar Función para Gestionar
            </label>
            <select
              id="reservation-show"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#16161A] px-4 py-3 text-xs font-medium text-white focus:border-[#E8B86A] focus:outline-none transition-colors"
            >
              {shows.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.pelicula.titulo} ·{" "}
                  {new Date(item.fechaHora).toLocaleString("es-CO", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>
          </div>

          {bookings === null && <div className="h-48 animate-pulse rounded-2xl bg-white/5" />}

          {bookings && (
            <section className="rounded-3xl border border-white/10 bg-[#111114] overflow-hidden p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white font-serif">{currentShow?.pelicula.titulo}</h3>
                  <p className="mt-0.5 text-xs text-white/50">
                    {currentShow &&
                      new Date(currentShow.fechaHora).toLocaleString("es-CO", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-xl bg-[#16161A] border border-white/5 px-3 py-1.5 text-white/80">
                    <strong>{bookings.length}</strong> reservas
                  </span>
                  <span className="rounded-xl bg-[#E8B86A]/10 border border-[#E8B86A]/20 px-3 py-1.5 font-bold text-[#E8B86A]">
                    <strong>{totalPersonas}</strong> / {currentShow?.cupoTotal ?? 16} cupos ocupados
                  </span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/40 italic">
                  Aún no hay reservas registradas para esta función.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        <th className="pb-3 font-semibold">Código</th>
                        <th className="pb-3 font-semibold">Cliente</th>
                        <th className="pb-3 font-semibold">Contacto</th>
                        <th className="pb-3 font-semibold">Entradas</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Estado</th>
                        <th className="pb-3 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.map((booking) => {
                        const isPendiente = booking.estadoEfectivo === "PENDIENTE_PAGO";
                        const isConfirmada = booking.estadoEfectivo === "CONFIRMADA";
                        const isVencida = booking.estadoEfectivo === "VENCIDA";
                        const isCancelada = booking.estadoEfectivo === "CANCELADA";

                        return (
                          <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 font-mono font-bold text-[#E8B86A]">
                              {booking.codigo}
                            </td>
                            <td className="py-3.5">
                              <p className="font-bold text-white">{booking.nombre}</p>
                              {booking.email && (
                                <p className="text-[10px] text-white/40">{booking.email}</p>
                              )}
                            </td>
                            <td className="py-3.5 font-mono text-white/80">
                              {booking.contacto}
                            </td>
                            <td className="py-3.5">
                              <div className="space-y-0.5">
                                <span className="rounded-md bg-[#16161A] border border-white/5 px-2 py-0.5 text-[10px] font-bold text-white">
                                  {booking.cantidad} {booking.cantidad === 1 ? "cupo" : "cupos"}
                                </span>
                                {booking.items && booking.items.length > 0 && (
                                  <p className="text-[10px] text-white/50">
                                    {booking.items
                                      .map((it) => `${it.tipoEntrada} ×${it.cantidad}`)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 font-mono font-bold text-white">
                              ${(booking.total || 0).toLocaleString("es-CO")}
                            </td>
                            <td className="py-3.5">
                              {isConfirmada && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/25 px-2.5 py-0.5 text-[10px] font-bold text-green-400">
                                  <FaCheckCircle className="text-[9px]" /> Pagada
                                </span>
                              )}
                              {isPendiente && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8B86A]/10 border border-[#E8B86A]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#E8B86A]">
                                  <FaClock className="text-[9px]" /> Pendiente
                                </span>
                              )}
                              {isVencida && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                                  <FaTimesCircle className="text-[9px]" /> Vencida
                                </span>
                              )}
                              {isCancelada && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/40">
                                  <FaTimesCircle className="text-[9px]" /> Cancelada
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 text-right">
                              {isPendiente && (
                                <button
                                  onClick={() => handleConfirmarPago(booking.id)}
                                  disabled={actionLoading[booking.id]}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-green-400 transition-colors disabled:opacity-50"
                                >
                                  {actionLoading[booking.id] ? (
                                    "Confirmando..."
                                  ) : (
                                    <>
                                      <FaCheckCircle /> Marcar Pagada
                                    </>
                                  )}
                                </button>
                              )}
                              {isConfirmada && (
                                <span className="text-[11px] text-white/40 italic">
                                  Validada{" "}
                                  {booking.confirmadoEn
                                    ? new Date(booking.confirmadoEn).toLocaleTimeString("es-CO", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
