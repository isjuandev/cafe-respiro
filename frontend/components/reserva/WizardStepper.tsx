"use client";

import Link from "next/link";
import { FaTicketAlt, FaUser, FaMoneyCheckAlt, FaCheck, FaCheckCircle } from "react-icons/fa";

interface WizardStepperProps {
  currentStep: 1 | 2 | 3 | 4;
  funcionId: string;
  totalEntradas?: number;
  isStep2Valid?: boolean;
  codigoReserva?: string;
}

export function WizardStepper({
  currentStep,
  funcionId,
  totalEntradas = 1,
  isStep2Valid,
  codigoReserva,
}: WizardStepperProps) {
  const steps = [
    {
      number: 1,
      title: "Entradas",
      subtitle: "Selección de tipo",
      icon: FaTicketAlt,
      href: `/reservar/${funcionId}/entradas`,
      isClickable: currentStep < 4,
      isCompleted: currentStep > 1,
    },
    {
      number: 2,
      title: "Tus Datos",
      subtitle: "Nombre y WhatsApp",
      icon: FaUser,
      href: `/reservar/${funcionId}/datos`,
      isClickable: currentStep < 4 && totalEntradas > 0,
      isCompleted: currentStep > 2,
    },
    {
      number: 3,
      title: "Pago Manual",
      subtitle: "Resumen y transferencia",
      icon: FaMoneyCheckAlt,
      href: `/reservar/${funcionId}/pago`,
      isClickable: currentStep < 4 && totalEntradas > 0 && isStep2Valid,
      isCompleted: currentStep > 3,
    },
    {
      number: 4,
      title: "Confirmación",
      subtitle: "Código y comprobante",
      icon: FaCheckCircle,
      href: codigoReserva ? `/reservar/${funcionId}/confirmacion?codigo=${codigoReserva}` : "#",
      isClickable: false,
      isCompleted: currentStep === 4,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCurrent = currentStep === step.number;
          const isCompleted = step.isCompleted && !isCurrent;
          const isFinished = currentStep === 4 && step.number === 4;

          const content = (
            <div
              className={`relative flex items-center gap-2 sm:gap-3 rounded-2xl border p-2 sm:p-3.5 transition-colors ${
                isFinished || isCurrent
                  ? "border-[#E8B86A]/40 bg-[#E8B86A]/10 text-white"
                  : isCompleted
                  ? "border-green-500/30 bg-green-500/5 text-white/90 hover:border-green-500/50"
                  : "border-white/5 bg-white/[0.02] text-white/40"
              }`}
            >
              {/* Badge número / icono */}
              <div
                className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isFinished || isCurrent
                    ? "bg-[#E8B86A] text-black"
                    : isCompleted
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {isCompleted ? <FaCheck className="text-[10px] sm:text-xs" /> : <Icon className="text-xs sm:text-sm" />}
              </div>

              {/* Textos del paso */}
              <div className="min-w-0 hidden md:block">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                  Paso {step.number}
                </p>
                <p
                  className={`text-xs font-bold truncate ${
                    isCurrent || isFinished ? "text-[#E8B86A]" : isCompleted ? "text-white" : "text-white/50"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );

          if (step.isClickable && !isCurrent) {
            return (
              <Link key={step.number} href={step.href} className="block group">
                {content}
              </Link>
            );
          }

          return <div key={step.number}>{content}</div>;
        })}
      </div>
    </div>
  );
}
