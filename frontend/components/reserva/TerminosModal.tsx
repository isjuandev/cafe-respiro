"use client";

import { useState } from "react";
import { FaTimes, FaFileContract, FaUserShield, FaBan } from "react-icons/fa";

type TabType = "terminos" | "privacidad" | "cancelaciones";

export function TerminosModal({
  isOpen,
  initialTab = "terminos",
  onClose,
}: {
  isOpen: boolean;
  initialTab?: TabType;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-[#111114] overflow-hidden">
        {/* Header con tabs */}
        <div className="border-b border-white/10 p-5 pb-3">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-lg font-black text-white font-serif flex items-center gap-2">
              <FaFileContract className="text-[#E8B86A]" /> Términos y Políticas de Café Respiro
            </h3>
            <button
              onClick={onClose}
              className="rounded-full bg-white/5 p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pt-2">
            <button
              onClick={() => setActiveTab("terminos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "terminos"
                  ? "bg-[#E8B86A] text-black"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <FaFileContract className="text-xs" /> Términos del Servicio
            </button>
            <button
              onClick={() => setActiveTab("privacidad")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "privacidad"
                  ? "bg-[#E8B86A] text-black"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <FaUserShield className="text-xs" /> Política de Datos (Habeas Data)
            </button>
            <button
              onClick={() => setActiveTab("cancelaciones")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "cancelaciones"
                  ? "bg-[#E8B86A] text-black"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <FaBan className="text-xs" /> Política de Cancelación
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm text-white/70 leading-relaxed">
          {activeTab === "terminos" && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-white">1. Condiciones Generales del Cineclub</h4>
              <p>
                Café Respiro opera una sala boutique cultural con capacidad de 16 puestos en la ciudad de Armenia, Quindío (Calle 9 # 13-29). Las proyecciones inician puntualmente a la hora indicada (7:00 PM).
              </p>
              <h4 className="text-base font-bold text-white pt-2">2. Proceso de Reserva y Validación</h4>
              <p>
                Al registrar tu reserva, los cupos quedan bloqueados durante 25 minutos. Si no se remite el comprobante de transferencia correspondiente por WhatsApp antes de dicho plazo, la reserva expirará automáticamente y los cupos serán liberados al público.
              </p>
              <h4 className="text-base font-bold text-white pt-2">3. Admisión y Convivencia</h4>
              <p>
                El ingreso a la sala se permite hasta 25 minutos después de iniciada la función para evitar interrupciones a los demás asistentes. No se permite el ingreso de alimentos o bebidas ajenos al establecimiento.
              </p>
            </div>
          )}

          {activeTab === "privacidad" && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-white">Tratamiento de Datos Personales (Ley 1581 de 2012)</h4>
              <p>
                En cumplimiento de la legislación colombiana de protección de datos personales, Café Respiro informa que los datos suministrados (Nombre, WhatsApp, Correo Electrónico) serán tratados exclusivamente para:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-white/80">
                <li>Gestión, validación y confirmación de tus reservas de cine.</li>
                <li>Envío de comprobantes de pago y recordatorios de la función.</li>
                <li>Comunicaciones directas relacionadas con cancelaciones o cambios por fuerza mayor.</li>
              </ul>
              <p className="pt-2">
                Tus datos no serán vendidos, cedidos ni transferidos a terceros. Puedes ejercer tus derechos de acceso, rectificación o supresión escribiéndonos a nuestro WhatsApp de atención.
              </p>
            </div>
          )}

          {activeTab === "cancelaciones" && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-white">Política de Modificaciones y Cancelaciones</h4>
              <p>
                Dado que nuestra sala cuenta con un aforo limitado de solo 16 sillas, las cancelaciones deben regirse por los siguientes términos:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-white/80">
                <li>
                  <strong className="text-white">Cancelaciones con más de 4 horas de anticipación:</strong> Podrás reprogramar tu entrada para cualquier otra función de la cartelera del mes.
                </li>
                <li>
                  <strong className="text-white">Cancelaciones con menos de 4 horas o no asistencia (No Show):</strong> No habrá lugar a devolución ni reprogramación, debido al costo de oportunidad del cupo reservado.
                </li>
                <li>
                  <strong className="text-white">Cancelación por parte de Café Respiro:</strong> En caso fortuito o fuerza mayor (cortes de energía, contingencias técnicas), se reprogramará la función o se reintegrará el 100% del valor transferido.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#E8B86A] px-6 py-2.5 text-xs font-bold text-black uppercase tracking-wider hover:bg-[#D4A574] transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
