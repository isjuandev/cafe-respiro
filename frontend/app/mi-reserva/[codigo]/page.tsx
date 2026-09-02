"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PagoQrCard } from "@/components/reserva/PagoQrCard";
import {
  FaCheckCircle,
  FaClock,
  FaWhatsapp,
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTimesCircle,
  FaArrowLeft,
  FaSyncAlt,
  FaTrashAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

interface ItemReserva {
  tipoEntrada: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface ReservaDetalle {
  id: string;
  codigo: string;
  estado: "PENDIENTE_PAGO" | "CONFIRMADA" | "CANCELADA" | "VENCIDA";
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
  pagoInfo: {
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    titular: string;
    documento?: string | null;
    qrImageUrl?: string | null;
    instrucciones?: string | null;
  };
  whatsappUrl: string;
}

export default function MiReservaPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const resolvedParams = use(params);
  const codigo = resolvedParams.codigo;

  const [reserva, setReserva] = useState<ReservaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  async function fetchReserva() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reservas/${codigo}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("No encontramos una reserva con ese código.");
        throw new Error("Error al consultar la reserva.");
      }
      const data = await res.json();
      setReserva(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelByCode() {
    try {
      setCanceling(true);
      setError(null);
      setCancelFeedback(null);

      const res = await fetch(`/api/reservas/${codigo}/cancelar`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al cancelar la reserva");
      }

      setCancelFeedback("Tu reserva ha sido cancelada exitosamente y los cupos han sido liberados.");
      setShowCancelModal(false);
      await fetchReserva();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al cancelar");
      setShowCancelModal(false);
    } finally {
      setCanceling(false);
    }
  }

  useEffect(() => {
    fetchReserva();
  }, [codigo]);

  // Temporizador regresivo hasta expiraEn
  useEffect(() => {
    if (!reserva || reserva.estado !== "PENDIENTE_PAGO") return;

    const interval = setInterval(() => {
      const diff = new Date(reserva.expiraEn).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00 (Expirado)");
        clearInterval(interval);
        fetchReserva(); // Recargar estado a VENCIDA
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reserva]);

  if (loading && !reserva) {
    return (
      <div className="min-h-screen bg-[#070709] px-4 py-16 text-white flex items-center justify-center">
        <div className="space-y-4 text-center animate-pulse">
          <div className="h-12 w-12 mx-auto rounded-full bg-[#E8B86A]/20" />
          <div className="h-4 w-48 mx-auto rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-[#070709] px-4 py-16 text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center space-y-4">
          <FaTimesCircle className="text-4xl text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Reserva no encontrada</h2>
          <p className="text-xs text-white/60">{error}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E8B86A] px-5 py-2.5 text-xs font-bold text-black uppercase hover:bg-[#D4A574]"
            >
              <FaArrowLeft /> Volver a la Cartelera
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { estado, funcion, items, total, pagoInfo, whatsappUrl } = reserva;
  const pelicula = funcion.pelicula;
  const fechaObj = new Date(funcion.fechaHora);
  const fechaFormateada = fechaObj.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const horaFormateada = fechaObj.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const totalFormateado = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(total);

  const diffMs = fechaObj.getTime() - Date.now();
  const diffHoras = diffMs / (1000 * 60 * 60);
  const puedeCancelar = (estado === "CONFIRMADA" || estado === "PENDIENTE_PAGO") && diffHoras >= 4;
  const noCancelable = (estado === "CONFIRMADA" || estado === "PENDIENTE_PAGO") && diffHoras < 4 && diffHoras > 0;

  return (
    <div className="min-h-screen bg-[#070709] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Barra Superior */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-[#E8B86A] transition-colors"
          >
            <FaArrowLeft /> Volver a la Cartelera
          </Link>
          <button
            onClick={fetchReserva}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10"
            title="Actualizar estado de reserva"
          >
            <FaSyncAlt className={loading ? "animate-spin text-xs" : "text-xs"} /> Actualizar
          </button>
        </div>

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

        {/* HERO STATUS CARD (Neutral & Natural) */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 text-center space-y-4 ${
            estado === "CONFIRMADA"
              ? "border-green-500/30 bg-[#111114]"
              : estado === "PENDIENTE_PAGO"
              ? "border-[#E8B86A]/30 bg-[#111114]"
              : "border-red-500/30 bg-[#111114]"
          }`}
        >
          {/* Badge de Estado Principal */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider">
            {estado === "CONFIRMADA" && (
              <span className="bg-green-500/10 text-green-400 border border-green-500/25 px-3 py-1 rounded-full flex items-center gap-1.5">
                <FaCheckCircle /> Pago Verificado · Entradas Confirmadas
              </span>
            )}
            {estado === "PENDIENTE_PAGO" && (
              <span className="bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/25 px-3 py-1 rounded-full flex items-center gap-1.5">
                <FaClock /> Pendiente de Comprobante de Pago
              </span>
            )}
            {estado === "VENCIDA" && (
              <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-3 py-1 rounded-full flex items-center gap-1.5">
                <FaTimesCircle /> Reserva Expirada (Cupos Liberados)
              </span>
            )}
            {estado === "CANCELADA" && (
              <span className="bg-white/5 text-white/50 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                <FaTimesCircle /> Reserva Cancelada
              </span>
            )}
          </div>

          {/* Código de Reserva Destacado */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/50 block">
              Tu Código de Reserva:
            </span>
            <span className="mt-1 text-4xl sm:text-5xl font-mono font-black text-white tracking-widest block selection:bg-[#E8B86A] selection:text-black">
              {reserva.codigo}
            </span>
          </div>

          {/* Temporizador para Pendientes */}
          {estado === "PENDIENTE_PAGO" && (
            <div className="inline-block rounded-2xl border border-white/10 bg-[#16161A] px-5 py-2.5">
              <span className="text-[11px] text-white/60 block">Tiempo restante para transferir:</span>
              <span className="text-2xl font-mono font-black text-[#E8B86A]">
                {timeLeft || "Calculando..."}
              </span>
            </div>
          )}

          {/* Mensaje descriptivo según estado */}
          <p className="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">
            {estado === "CONFIRMADA" &&
              "¡Todo listo! Tus entradas están aseguradas. Presenta este código al ingresar a Café Respiro."}
            {estado === "PENDIENTE_PAGO" &&
              "Tus cupos están reservados temporalmente. Transfiere el valor y envía el comprobante por WhatsApp para validar tus entradas."}
            {estado === "VENCIDA" &&
              "El tiempo límite de 25 minutos para adjuntar el comprobante expiró y los cupos fueron liberados. Puedes generar una nueva reserva."}
            {estado === "CANCELADA" &&
              "Esta reserva fue cancelada y no tiene validez para ingresar a la sala."}
          </p>

          {/* Botón Principal de WhatsApp para Pendiente */}
          {estado === "PENDIENTE_PAGO" && (
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl bg-green-500 px-8 py-4 text-xs sm:text-sm font-black tracking-wider text-black uppercase transition-colors hover:bg-green-400"
              >
                <FaWhatsapp className="text-lg" /> Enviar Comprobante por WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* DETALLES DE LA FUNCIÓN Y ENTRADAS */}
        <div className="rounded-3xl border border-white/10 bg-[#111114] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {pelicula.posterUrl && (
              <img
                src={pelicula.posterUrl}
                alt={pelicula.titulo}
                className="aspect-[2/3] w-24 rounded-2xl object-cover border border-white/10 shrink-0 bg-black"
              />
            )}

            <div className="space-y-2 flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8B86A]">
                Función Programada
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-serif">
                {pelicula.titulo}
              </h3>

              <div className="grid gap-2 sm:grid-cols-2 text-xs text-white/70 pt-1">
                <p className="flex items-center gap-2 capitalize">
                  <FaCalendarAlt className="text-[#E8B86A]" /> {fechaFormateada}
                </p>
                <p className="flex items-center gap-2 font-bold text-white">
                  <FaClock className="text-[#E8B86A]" /> {horaFormateada}
                </p>
                <p className="flex items-center gap-2 sm:col-span-2">
                  <FaMapMarkerAlt className="text-[#E8B86A]" /> Café Respiro · Calle 9 # 13-29 Armenia
                </p>
              </div>
            </div>
          </div>

          {/* Desglose de Entradas */}
          <div className="border-t border-white/10 pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <FaTicketAlt className="text-[#E8B86A]" /> Entradas Reservadas ({reserva.cantidad} puestos)
            </h4>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-2 border-b border-white/5"
                >
                  <span className="font-bold text-white">
                    {it.tipoEntrada} <span className="text-white/40 font-normal">× {it.cantidad}</span>
                  </span>
                  <span className="font-mono font-bold text-[#E8B86A]">
                    ${it.subtotal.toLocaleString("es-CO")}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-white">Total:</span>
              <span className="text-2xl font-black text-[#E8B86A] font-serif">
                {totalFormateado}
              </span>
            </div>
          </div>
        </div>

        {/* GESTIÓN / CANCELACIÓN DE RESERVA */}
        {(puedeCancelar || noCancelable) && (
          <div className="rounded-3xl border border-white/10 bg-[#111114] p-6 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  ¿No puedes asistir a la función?
                </h4>
                <p className="mt-1 text-white/60 max-w-md">
                  Las cancelaciones están permitidas con un mínimo de 4 horas de anticipación a la función para liberar tus cupos para otros clientes.
                </p>
              </div>

              {puedeCancelar && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 font-bold text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
                >
                  <FaTrashAlt className="text-xs" /> Cancelar Reserva
                </button>
              )}

              {noCancelable && (
                <span className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/40 italic">
                  Cancelación no disponible (&lt; 4h para la función)
                </span>
              )}
            </div>
          </div>
        )}

        {/* TARJETA DE DATOS BANCARIOS (Si sigue pendiente) */}
        {estado === "PENDIENTE_PAGO" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
              Datos para realizar la transferencia:
            </h3>
            <PagoQrCard pagoInfo={pagoInfo} total={total} />
          </div>
        )}
      </div>

      {/* Modal de Cancelación por Código */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111114] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
              <FaExclamationTriangle className="text-2xl" />
            </div>

            <h3 className="text-xl font-bold text-white">¿Cancelar tu reserva?</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Estás a punto de cancelar tu reserva de{" "}
              <strong className="text-white">
                {reserva.cantidad} {reserva.cantidad === 1 ? "cupo" : "cupos"}
              </strong>{" "}
              para la función de <strong className="text-[#E8B86A]">{pelicula.titulo}</strong>.
            </p>

            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 text-left">
              <span>
                <strong>Importante:</strong> Al confirmar, tu código #{reserva.codigo} quedará cancelado y los cupos se liberarán inmediatamente.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={canceling}
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={canceling}
                onClick={handleCancelByCode}
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
