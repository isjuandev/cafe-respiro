"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WizardStepper } from "@/components/reserva/WizardStepper";
import { PagoQrCard } from "@/components/reserva/PagoQrCard";
import {
  FaCheckCircle,
  FaClock,
  FaWhatsapp,
  FaTicketAlt,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaSyncAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
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
  expiraEn: string;
  nombre: string;
  contacto: string;
  email?: string | null;
  cantidad: number;
  total: number;
  items: ItemReserva[];
  funcion: {
    id: string;
    fechaHora: string;
    pelicula: {
      titulo: string;
      posterUrl?: string | null;
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

export default function ConfirmacionReservaPage({
  params,
}: {
  params: Promise<{ funcionId: string }>;
}) {
  const resolvedParams = use(params);
  const funcionId = resolvedParams.funcionId;
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo");
  const router = useRouter();

  const [reserva, setReserva] = useState<ReservaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  async function fetchReservaData(cod: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reservas/${cod}`);
      if (!res.ok) {
        throw new Error("No se pudo obtener la información de la reserva.");
      }
      const data = await res.json();
      setReserva(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la reserva");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (codigo) {
      fetchReservaData(codigo);
    } else {
      setLoading(false);
    }
  }, [codigo]);

  // Temporizador regresivo
  useEffect(() => {
    if (!reserva || reserva.estado !== "PENDIENTE_PAGO") return;

    const interval = setInterval(() => {
      const diff = new Date(reserva.expiraEn).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00 (Expirado)");
        clearInterval(interval);
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

  const handleCopyCode = () => {
    if (reserva?.codigo && navigator?.clipboard) {
      navigator.clipboard.writeText(reserva.codigo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!codigo) {
    return (
      <div className="space-y-6">
        <WizardStepper currentStep={4} funcionId={funcionId} />
        <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center space-y-4">
          <p className="text-white/60 text-sm">No se especificó un código de reserva.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E8B86A] px-6 py-3 text-xs font-bold text-black uppercase hover:bg-[#D4A574]"
          >
            <FaArrowLeft /> Volver a la Cartelera
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !reserva) {
    return (
      <div className="space-y-6 animate-pulse">
        <WizardStepper currentStep={4} funcionId={funcionId} />
        <div className="h-64 rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="space-y-6">
        <WizardStepper currentStep={4} funcionId={funcionId} />
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center space-y-3">
          <p className="font-bold text-red-400">Error al cargar la confirmación</p>
          <p className="text-xs text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  const { estado, total, pagoInfo, whatsappUrl, funcion, items } = reserva;
  const isPendiente = estado === "PENDIENTE_PAGO";
  const isConfirmada = estado === "CONFIRMADA";

  const totalFormateado = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(total);

  return (
    <div className="space-y-6">
      {/* Stepper en Paso 4 (Completado) */}
      <WizardStepper
        currentStep={4}
        funcionId={funcionId}
        codigoReserva={reserva.codigo}
      />

      {/* HERO TICKET DE CONFIRMACIÓN */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 text-center space-y-5 ${
          isConfirmada
            ? "border-green-500/30 bg-[#111114]"
            : "border-[#E8B86A]/30 bg-[#111114]"
        }`}
      >
        {/* Badge de Estado */}
        <div className="inline-flex items-center gap-2">
          {isConfirmada ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/25 px-4 py-1 text-xs font-bold text-green-400">
              <FaCheckCircle /> Pago Confirmado · Entradas Aseguradas
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8B86A]/10 border border-[#E8B86A]/25 px-4 py-1 text-xs font-bold text-[#E8B86A]">
              <FaClock /> Reserva Registrada · Pendiente de Pago
            </span>
          )}
        </div>

        {/* Bloque del Código de Reserva */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Tu Código Único de Reserva
          </span>
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest select-all">
              {reserva.codigo}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#16161A] px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              title="Copiar código de reserva"
            >
              {copiedCode ? (
                <>
                  <FaCheck className="text-green-400 text-xs" /> Copiado
                </>
              ) : (
                <>
                  <FaCopy className="text-xs" /> Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Temporizador para pago */}
        {isPendiente && (
          <div className="inline-block rounded-2xl border border-white/10 bg-[#16161A] px-6 py-2.5">
            <span className="text-[11px] text-white/60 block">Tiempo restante para transferir:</span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-[#E8B86A]">
              {timeLeft || "Calculando..."}
            </span>
          </div>
        )}

        <p className="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">
          {isConfirmada
            ? "¡Tu pago ha sido validado exitosamente! Te esperamos en la sala de Café Respiro."
            : "Tus cupos están reservados temporalmente. Para asegurar tus entradas, realiza la transferencia y envía el comprobante por WhatsApp indicando tu código de reserva."}
        </p>

        {/* Botón Principal de WhatsApp */}
        {isPendiente && (
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-green-500 px-8 py-4 text-xs sm:text-sm font-black tracking-wider text-black uppercase transition-colors hover:bg-green-400"
            >
              <FaWhatsapp className="text-xl" /> Enviar Comprobante por WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* DETALLES BANCARIOS Y QR */}
      {isPendiente && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
            Datos para realizar la transferencia:
          </h3>
          <PagoQrCard pagoInfo={pagoInfo} total={total} />
        </div>
      )}

      {/* Botones de Navegación Final */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
        >
          <FaArrowLeft className="text-xs" /> Volver a la Cartelera
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#E8B86A]/30 bg-[#E8B86A]/10 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#E8B86A] hover:bg-[#E8B86A] hover:text-black transition-all"
        >
          Ver Mis Reservas →
        </Link>
      </div>
    </div>
  );
}
