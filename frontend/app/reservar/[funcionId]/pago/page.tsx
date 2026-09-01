"use client";

import { useEffect, useState } from "react";
import { useReservaWizard } from "@/components/reserva/ReservaWizardContext";
import { WizardStepper } from "@/components/reserva/WizardStepper";
import { PagoQrCard } from "@/components/reserva/PagoQrCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaShieldAlt,
  FaUser,
  FaWhatsapp,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";

export default function PagoManualPage() {
  const router = useRouter();
  const {
    funcionId,
    funcion,
    itemsSeleccionados,
    totalEntradas,
    totalPrecio,
    nombre,
    contacto,
    email,
    aceptoTerminos,
    pagoInfo,
    resetForm,
    loading,
  } = useReservaWizard();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);

  // Redirección segura si faltan datos pero solo cuando no se está confirmando la reserva
  useEffect(() => {
    if (loading || submitting || confirmedCode) return;
    if (totalEntradas === 0) {
      router.replace(`/reservar/${funcionId}/entradas`);
    } else if (!nombre.trim() || !contacto.trim() || !aceptoTerminos) {
      router.replace(`/reservar/${funcionId}/datos`);
    }
  }, [loading, submitting, confirmedCode, totalEntradas, nombre, contacto, aceptoTerminos, funcionId, router]);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />;
  }

  // Estado de transición hacia confirmación
  if (confirmedCode) {
    return (
      <div className="rounded-3xl border border-[#E8B86A]/30 bg-[#111114] p-12 text-center space-y-4">
        <FaCheckCircle className="mx-auto text-4xl text-[#E8B86A] animate-pulse" />
        <h2 className="text-xl font-black text-white font-serif">¡Reserva Registrada con Éxito!</h2>
        <p className="text-xs text-white/60">Cargando tu comprobante de reserva...</p>
      </div>
    );
  }

  // Si no hay entradas y no está cargando, retornar placeholder mientras redirige
  if (totalEntradas === 0 || !nombre.trim() || !contacto.trim() || !aceptoTerminos) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />;
  }

  const handleConfirmarReserva = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        nombre: nombre.trim(),
        contacto: contacto.trim(),
        email: email.trim() || undefined,
        items: itemsSeleccionados.map((i) => ({
          tipoEntradaId: i.tipo.id,
          cantidad: i.cantidad,
        })),
        aceptoTerminos: true,
      };

      const res = await fetch(`/api/funciones/${funcionId}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Error al procesar la reserva";
        throw new Error(msg);
      }

      const codigoGenerado = data.reserva.codigo;
      setConfirmedCode(codigoGenerado);

      // Limpiar datos del wizard en cliente
      resetForm();

      // Redirigir de forma inmediata a la pantalla de confirmación del paso 4
      router.push(`/reservar/${funcionId}/confirmacion?codigo=${codigoGenerado}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error inesperado");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <WizardStepper
        currentStep={3}
        funcionId={funcionId}
        totalEntradas={totalEntradas}
        isStep2Valid={true}
      />

      {/* Título de Sección */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-serif">
          3. Confirmar Reserva y Método de Pago
        </h1>
        <p className="text-xs sm:text-sm text-white/60">
          Revisa el resumen y realiza tu transferencia para asegurar tus cupos en la sala boutique.
        </p>
      </div>

      {/* Tarjeta de Resumen de Datos del Asistente */}
      <div className="rounded-3xl border border-white/10 bg-[#111114] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
            Datos del Asistente
          </h2>
          <Link
            href={`/reservar/${funcionId}/datos`}
            className="text-xs font-bold text-white/60 hover:text-white transition-colors"
          >
            Editar datos
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="flex items-center gap-2.5 text-white/80">
            <FaUser className="text-[#E8B86A]" />
            <span className="font-medium text-white">{nombre}</span>
          </div>

          <div className="flex items-center gap-2.5 text-white/80">
            <FaWhatsapp className="text-green-400" />
            <span className="font-mono font-medium text-white">{contacto}</span>
          </div>

          {email && (
            <div className="flex items-center gap-2.5 text-white/80 sm:col-span-2">
              <FaEnvelope className="text-[#E8B86A]" />
              <span className="font-medium text-white">{email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta con los datos bancarios y QR de Café Respiro */}
      {pagoInfo && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
            Datos de Transferencia
          </h2>
          <PagoQrCard pagoInfo={pagoInfo} total={totalPrecio} />
        </div>
      )}

      {/* Error si el backend falla */}
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm text-red-300 space-y-1"
        >
          <p className="font-bold">No se pudo registrar la reserva:</p>
          <p>{submitError}</p>
        </div>
      )}

      {/* Botones de Navegación y Acción Final */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <Link
          href={`/reservar/${funcionId}/datos`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
        >
          <FaArrowLeft className="text-xs" /> Volver a Datos
        </Link>

        <button
          type="button"
          onClick={handleConfirmarReserva}
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E8B86A] px-8 py-3.5 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-[#D4A574] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Procesando Reserva…
            </>
          ) : (
            <>
              <FaCheckCircle className="text-sm" /> Confirmar Reserva ({totalEntradas}{" "}
              {totalEntradas === 1 ? "Entrada" : "Entradas"})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
