"use client";

import { useReservaWizard } from "./ReservaWizardContext";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaShieldAlt } from "react-icons/fa";

export function ResumenReservaSidebar() {
  const { funcion, itemsSeleccionados, totalEntradas, totalPrecio } = useReservaWizard();

  if (!funcion) return null;

  const pelicula = funcion.pelicula;
  const poster =
    pelicula.posterUrl ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop";

  const fechaObj = new Date(funcion.fechaHora);
  const fechaStr = fechaObj.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const horaStr = fechaObj.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const totalFormateado = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(totalPrecio);

  return (
    <aside className="sticky top-24 rounded-3xl border border-white/10 bg-[#111114] p-5 sm:p-6 space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
          Resumen de tu Reserva
        </h3>
      </div>

      {/* Mini Card de la Película y Función */}
      <div className="flex gap-4 items-start">
        <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
          <img
            src={poster}
            alt={pelicula.titulo}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop";
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-sm sm:text-base font-black text-white font-serif line-clamp-2 leading-snug">
            {pelicula.titulo}
          </h4>
          <p className="text-[11px] text-white/60 line-clamp-1">
            {pelicula.director ? `Dir: ${pelicula.director}` : "Cine Café Respiro"}
          </p>

          <div className="pt-1.5 space-y-1 text-[11px] text-white/70">
            <p className="flex items-center gap-1.5 capitalize">
              <FaCalendarAlt className="text-[#E8B86A] text-[10px]" />
              {fechaStr}
            </p>
            <p className="flex items-center gap-1.5 font-bold text-white">
              <FaClock className="text-[#E8B86A] text-[10px]" />
              {horaStr}
            </p>
          </div>
        </div>
      </div>

      {/* Ubicación y Sala */}
      <div className="rounded-xl bg-[#16161A] border border-white/5 p-3 text-[11px] text-white/70 space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-white/90">
          <FaMapMarkerAlt className="text-[#E8B86A] text-xs" />
          Calle 9 # 13-29 Armenia, Quindío
        </div>
        <p className="text-white/50 text-[10px] pl-4">
          Sala boutique de 16 puestos · Proyección íntima
        </p>
      </div>

      {/* Desglose de Entradas Seleccionadas */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white/80 flex items-center gap-1.5">
            <FaTicketAlt className="text-[#E8B86A]" /> Entradas
          </span>
          <span className="text-white/50">{totalEntradas} seleccionada(s)</span>
        </div>

        {itemsSeleccionados.length === 0 ? (
          <p className="text-xs text-white/40 italic py-2">
            Aún no has seleccionado ninguna entrada.
          </p>
        ) : (
          <div className="space-y-2">
            {itemsSeleccionados.map(({ tipo, cantidad, subtotal }) => (
              <div
                key={tipo.id}
                className="flex items-center justify-between text-xs text-white/80 py-1 border-b border-white/5"
              >
                <div>
                  <span className="font-bold text-white">{tipo.nombre}</span>{" "}
                  <span className="text-white/50">× {cantidad}</span>
                </div>
                <span className="font-bold text-[#E8B86A]">
                  ${subtotal.toLocaleString("es-CO")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total a Pagar */}
      <div className="rounded-2xl border border-white/10 bg-[#16161A] p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Total a Transferir:</span>
          <span>COP</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl sm:text-2xl font-black text-[#E8B86A] font-serif">
            {totalFormateado}
          </span>
          <span className="rounded-full bg-[#E8B86A]/10 border border-[#E8B86A]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#E8B86A]">
            {totalEntradas} {totalEntradas === 1 ? "cupo" : "cupos"}
          </span>
        </div>
      </div>

      {/* Garantía de reserva */}
      <div className="flex items-start gap-2 pt-2 text-[10px] text-white/40 leading-relaxed">
        <FaShieldAlt className="text-[#E8B86A] text-xs shrink-0 mt-0.5" />
        <span>
          Tu reserva quedará registrada y los cupos reservados durante 25 minutos para realizar la transferencia y adjuntar tu comprobante por WhatsApp.
        </span>
      </div>
    </aside>
  );
}
