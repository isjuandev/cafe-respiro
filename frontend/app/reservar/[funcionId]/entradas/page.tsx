"use client";

import { useReservaWizard } from "@/components/reserva/ReservaWizardContext";
import { WizardStepper } from "@/components/reserva/WizardStepper";
import { useRouter } from "next/navigation";
import { FaPlus, FaMinus, FaArrowRight, FaTicketAlt, FaInfoCircle } from "react-icons/fa";

export default function SeleccionEntradasPage() {
  const router = useRouter();
  const {
    funcionId,
    funcion,
    tiposEntrada,
    cantidades,
    incrementCantidad,
    decrementCantidad,
    totalEntradas,
    loading,
    error,
  } = useReservaWizard();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 rounded-2xl bg-white/5" />
        <div className="h-48 rounded-3xl bg-white/5" />
        <div className="h-48 rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (error || !funcion) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="font-bold text-red-400">No se pudo cargar la función</p>
        <p className="mt-2 text-xs text-white/60">{error || "Función no disponible"}</p>
      </div>
    );
  }

  const cuposDisponibles = funcion.cuposDisponibles;
  const aforoLleno = cuposDisponibles <= 0;
  const alcanzoMaximo = totalEntradas >= cuposDisponibles;

  const handleContinue = () => {
    if (totalEntradas > 0) {
      router.push(`/reservar/${funcionId}/datos`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <WizardStepper currentStep={1} funcionId={funcionId} totalEntradas={totalEntradas} />

      {/* Título de Sección */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-serif">
          1. Selecciona tus Entradas
        </h1>
        <p className="text-xs sm:text-sm text-white/60">
          Elige el tipo y cantidad de boletas para tu experiencia en Café Respiro.
        </p>
      </div>

      {/* Aviso de aforo disponible */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
        <span className="text-white/70 flex items-center gap-2">
          <FaInfoCircle className="text-[#E8B86A]" /> Aforo restante en sala:
        </span>
        <span
          className={`font-bold ${
            aforoLleno ? "text-red-400" : "text-[#E8B86A]"
          }`}
        >
          {aforoLleno ? "Agotado" : `${cuposDisponibles} de ${funcion.cupoTotal} puestos disponibles`}
        </span>
      </div>

      {/* Lista de Tipos de Entrada */}
      <div className="space-y-4">
        {tiposEntrada.map((tipo) => {
          const cantidad = cantidades[tipo.id] || 0;
          const precioFormateado = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          }).format(tipo.precio);

          return (
            <div
              key={tipo.id}
              className={`group relative rounded-3xl border p-5 sm:p-6 transition-colors ${
                cantidad > 0
                  ? "border-[#E8B86A]/40 bg-[#E8B86A]/5"
                  : "border-white/10 bg-[#111114] hover:border-white/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info del Tipo de Entrada */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8B86A]/10 text-[#E8B86A] text-sm">
                      <FaTicketAlt />
                    </span>
                    <h3 className="text-lg font-black text-white font-serif">
                      {tipo.nombre}
                    </h3>
                  </div>

                  {tipo.descripcion && (
                    <p className="text-xs text-white/70 leading-relaxed pl-11">
                      {tipo.descripcion}
                    </p>
                  )}

                  <div className="pl-11 pt-1">
                    <span className="text-base sm:text-lg font-black text-[#E8B86A] font-serif">
                      {precioFormateado}
                    </span>
                    <span className="text-[11px] text-white/40 ml-1.5 font-sans">
                      / persona
                    </span>
                  </div>
                </div>

                {/* Contador de Cantidad */}
                <div className="flex items-center justify-end gap-3 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => decrementCantidad(tipo.id)}
                    disabled={cantidad === 0}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Disminuir cantidad"
                  >
                    <FaMinus className="text-xs" />
                  </button>

                  <span className="w-8 text-center text-lg font-bold font-mono text-white">
                    {cantidad}
                  </span>

                  <button
                    type="button"
                    onClick={() => incrementCantidad(tipo.id)}
                    disabled={alcanzoMaximo || aforoLleno}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8B86A] text-black font-bold transition-all hover:bg-[#D4A574] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Aumentar cantidad"
                  >
                    <FaPlus className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alcanzoMaximo && !aforoLleno && (
        <p className="text-xs text-[#E8B86A] text-right font-medium">
          Has alcanzado el cupo máximo disponible para esta función ({cuposDisponibles} entradas).
        </p>
      )}

      {/* Botón de Continuar */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleContinue}
          disabled={totalEntradas === 0 || aforoLleno}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-[#E8B86A] px-8 py-4 text-xs sm:text-sm font-black tracking-wider text-black uppercase transition-colors hover:bg-[#D4A574] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          {totalEntradas === 0
            ? "Selecciona al menos 1 entrada"
            : `Continuar con ${totalEntradas} ${totalEntradas === 1 ? "entrada" : "entradas"}`}
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}
