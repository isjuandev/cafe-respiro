"use client";

import { useEffect, useState } from "react";

interface Show {
  id: string;
  fechaHora: string;
  cupoTotal: number;
  cuposDisponibles?: number;
  cuposOcupados?: number;
  pelicula: { titulo: string };
}

interface Booking {
  id: string;
  nombre: string;
  contacto: string;
  cantidad: number;
  createdAt: string;
}

export default function AdminReservationsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [selected, setSelected] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShows() {
      try {
        setLoading(true);
        const res = await fetch("/api/funciones");
        if (!res.ok) throw new Error("No se pudieron cargar las funciones");
        const data = await res.json();
        const funciones: Show[] = data.funciones || [];
        setShows(funciones);
        if (funciones.length > 0) {
          setSelected(funciones[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchShows();
  }, []);

  useEffect(() => {
    if (!selected) {
      setBookings([]);
      return;
    }

    async function fetchBookings() {
      try {
        setBookings(null);
        const res = await fetch(`/api/admin/funciones/${selected}/reservas`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("No se pudieron cargar las reservas");
        const data = await res.json();
        setBookings(data.reservas || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar reservas");
      }
    }
    fetchBookings();
  }, [selected]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white/5" />;
  }

  const currentShow = shows.find((item) => item.id === selected);
  const totalPersonas = bookings?.reduce((acc, curr) => acc + curr.cantidad, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reservas</h2>
        <p className="mt-1 text-sm text-white/60">
          Consulta y controla la lista de asistentes por función programada.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 border border-red-500/20"
        >
          {error}
        </div>
      )}

      {!shows.length && !error && (
        <div className="surface-card p-8 text-center text-sm text-white/60">
          No hay funciones programadas disponibles.
        </div>
      )}

      {shows.length > 0 && (
        <>
          <div className="surface-card p-5">
            <label htmlFor="reservation-show" className="text-xs font-bold tracking-wider text-white/60">
              SELECCIONAR FUNCIÓN
            </label>
            <select
              id="reservation-show"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="control-dark mt-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:border-[#E8B86A]/50 focus:outline-none"
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

          {bookings === null && <div className="h-48 animate-pulse rounded-xl bg-white/5" />}

          {bookings && (
            <section className="surface-card overflow-hidden p-5">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{currentShow?.pelicula.titulo}</h3>
                  <p className="mt-0.5 text-xs text-white/50">
                    {currentShow &&
                      new Date(currentShow.fechaHora).toLocaleString("es-CO", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="rounded-lg bg-white/5 px-3 py-1.5 text-white/80">
                    <strong>{bookings.length}</strong> reservas
                  </span>
                  <span className="rounded-lg bg-[#E8B86A]/15 px-3 py-1.5 font-bold text-[#E8B86A]">
                    <strong>{totalPersonas}</strong> / {currentShow?.cupoTotal ?? 16} cupos ocupados
                  </span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/50">
                  Aún no hay reservas registradas para esta función.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-xs tracking-wider text-white/40">
                        <th className="pb-3 font-semibold">CLIENTE</th>
                        <th className="pb-3 font-semibold">CONTACTO</th>
                        <th className="pb-3 font-semibold">PERSONAS</th>
                        <th className="pb-3 font-semibold">FECHA RESERVA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 font-medium text-white">{booking.nombre}</td>
                          <td className="py-3 text-white/70">{booking.contacto}</td>
                          <td className="py-3">
                            <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-[#E8B86A]">
                              {booking.cantidad}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-white/40">
                            {new Date(booking.createdAt).toLocaleString("es-CO", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                        </tr>
                      ))}
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
