"use client";

import { useState } from "react";
import { useReservaWizard } from "@/components/reserva/ReservaWizardContext";
import { WizardStepper } from "@/components/reserva/WizardStepper";
import { TerminosModal } from "@/components/reserva/TerminosModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUser,
  FaWhatsapp,
  FaEnvelope,
  FaShieldAlt,
} from "react-icons/fa";

export default function DatosAsistentePage() {
  const router = useRouter();
  const {
    funcionId,
    totalEntradas,
    nombre,
    contacto,
    email,
    aceptoTerminos,
    authUser,
    setNombre,
    setContacto,
    setEmail,
    setAceptoTerminos,
    limpiarDatosContacto,
    loading,
  } = useReservaWizard();

  const [modalTab, setModalTab] = useState<"terminos" | "privacidad" | "cancelaciones">("terminos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />;
  }

  // Si el usuario llega aquí sin entradas seleccionadas, redirigir al paso 1
  if (totalEntradas === 0) {
    router.replace(`/reservar/${funcionId}/entradas`);
    return null;
  }

  const isFormValid =
    nombre.trim().length >= 2 &&
    contacto.trim().length >= 7 &&
    aceptoTerminos;

  const openModalWithTab = (tab: "terminos" | "privacidad" | "cancelaciones") => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!contacto.trim() || contacto.trim().length < 7) {
      setFormError("Por favor ingresa un número de WhatsApp válido.");
      return;
    }
    if (!aceptoTerminos) {
      setFormError("Debes aceptar los términos y políticas para continuar.");
      return;
    }

    setFormError(null);
    router.push(`/reservar/${funcionId}/pago`);
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <WizardStepper
        currentStep={2}
        funcionId={funcionId}
        totalEntradas={totalEntradas}
        isStep2Valid={isFormValid}
      />

      {/* Título de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white font-serif">
            2. Datos del Asistente
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Ingresa tus datos para registrar la reserva y enviarte el comprobante.
          </p>
        </div>
        {(nombre || contacto || email) && (
          <button
            type="button"
            onClick={limpiarDatosContacto}
            className="self-start sm:self-auto text-xs font-bold text-white/40 hover:text-red-400 transition-colors underline"
          >
            Limpiar datos
          </button>
        )}
      </div>

      {authUser && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#E8B86A]/30 bg-[#E8B86A]/5 px-4 py-2.5 text-xs text-[#E8B86A]">
          <span>✨ Autocompletado con tu cuenta registrada{authUser.nombre ? ` (${authUser.nombre})` : ""}.</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleContinue} className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-[#111114] p-5 sm:p-7 space-y-5">
          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label
              htmlFor="nombre"
              className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5"
            >
              <FaUser className="text-[#E8B86A]" /> Nombre Completo *
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan David Gómez"
              className="w-full rounded-2xl border border-white/10 bg-[#16161A] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#E8B86A] focus:outline-none transition-colors"
            />
          </div>

          {/* WhatsApp / Teléfono */}
          <div className="space-y-1.5">
            <label
              htmlFor="contacto"
              className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5"
            >
              <FaWhatsapp className="text-green-400" /> WhatsApp de Contacto *
            </label>
            <input
              id="contacto"
              type="tel"
              required
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej. 300 123 4567"
              className="w-full rounded-2xl border border-white/10 bg-[#16161A] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#E8B86A] focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-white/40">
              Número al cual te llegará la confirmación y por donde enviarás el comprobante.
            </p>
          </div>

          {/* Correo Electrónico (Opcional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5"
            >
              <FaEnvelope className="text-[#E8B86A]" /> Correo Electrónico (Opcional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej. juan@example.com"
              className="w-full rounded-2xl border border-white/10 bg-[#16161A] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#E8B86A] focus:outline-none transition-colors"
            />
          </div>

          {/* Checkbox de Términos con Links Interactivos a Modales */}
          <div className="rounded-2xl border border-white/10 bg-[#16161A] p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptoTerminos}
                onChange={(e) => setAceptoTerminos(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-[#E8B86A] focus:ring-[#E8B86A] cursor-pointer"
              />
              <span className="text-xs text-white/80 leading-relaxed">
                He leído y acepto los{" "}
                <button
                  type="button"
                  onClick={() => openModalWithTab("terminos")}
                  className="text-[#E8B86A] font-bold underline hover:text-[#D4A574]"
                >
                  Términos del Servicio
                </button>
                , la{" "}
                <button
                  type="button"
                  onClick={() => openModalWithTab("privacidad")}
                  className="text-[#E8B86A] font-bold underline hover:text-[#D4A574]"
                >
                  Política de Privacidad de Datos
                </button>{" "}
                y la{" "}
                <button
                  type="button"
                  onClick={() => openModalWithTab("cancelaciones")}
                  className="text-[#E8B86A] font-bold underline hover:text-[#D4A574]"
                >
                  Política de Cancelaciones
                </button>{" "}
                de Café Respiro.
              </span>
            </label>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {formError}
            </div>
          )}
        </div>

        {/* Botones de Navegación */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Link
            href={`/reservar/${funcionId}/entradas`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
          >
            <FaArrowLeft className="text-xs" /> Volver
          </Link>

          <button
            type="submit"
            disabled={!isFormValid}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#E8B86A] px-8 py-3.5 text-xs sm:text-sm font-black tracking-wider text-black uppercase transition-colors hover:bg-[#D4A574] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar al Pago
            <FaArrowRight className="text-xs" />
          </button>
        </div>
      </form>

      {/* Modal de Políticas y Términos */}
      <TerminosModal
        isOpen={isModalOpen}
        initialTab={modalTab}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
