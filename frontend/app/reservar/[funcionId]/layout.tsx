"use client";

import { use } from "react";
import { usePathname } from "next/navigation";
import { ReservaWizardProvider } from "@/components/reserva/ReservaWizardContext";
import { ResumenReservaSidebar } from "@/components/reserva/ResumenReservaSidebar";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function ReservarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ funcionId: string }>;
}) {
  const resolvedParams = use(params);
  const funcionId = resolvedParams.funcionId;
  const pathname = usePathname();
  const isConfirmacion = pathname.includes("/confirmacion");

  return (
    <ReservaWizardProvider funcionId={funcionId}>
      <div className="min-h-screen bg-[#070709] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          {/* Barra superior de navegación */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-[#E8B86A] transition-colors"
            >
              <FaArrowLeft className="text-xs" /> Volver a la Cartelera
            </Link>
            <span className="text-[11px] font-bold text-white/40">
              Cine Café Respiro · Armenia, Quindío
            </span>
          </div>

          {/* Grid Principal: En confirmación centramos el ticket; en pasos 1-3 mostramos grid con sidebar */}
          {isConfirmacion ? (
            <div className="mx-auto max-w-3xl space-y-6">
              <main className="w-full">{children}</main>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
              <main className="lg:col-span-8 space-y-6">{children}</main>

              <div className="lg:col-span-4">
                <ResumenReservaSidebar />
              </div>
            </div>
          )}
        </div>
      </div>
    </ReservaWizardProvider>
  );
}
