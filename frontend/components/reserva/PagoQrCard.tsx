"use client";

import { useState } from "react";
import { FaCopy, FaCheck, FaUniversity, FaQrcode, FaInfoCircle } from "react-icons/fa";
import { PagoInfo } from "./ReservaWizardContext";

export function PagoQrCard({
  pagoInfo,
  total,
}: {
  pagoInfo?: PagoInfo | null;
  total?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  const info: PagoInfo = pagoInfo || {
    banco: "Bancolombia",
    tipoCuenta: "Ahorros",
    numeroCuenta: "123-456789-01",
    titular: "Café Respiro S.A.S.",
    documento: "NIT 901.234.567-8",
    qrImageUrl: "/images/pago-qr.png",
    telefonoWp: "573001234567",
    instrucciones:
      "Realiza la transferencia por el total exacto y envía el comprobante por WhatsApp indicando tu código de reserva.",
  };

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(info.numeroCuenta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111114] p-5 sm:p-7 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#E8B86A]">
            Datos para la Transferencia
          </span>
          <h3 className="text-lg font-black text-white font-serif">
            {info.banco} · {info.tipoCuenta}
          </h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20">
          <FaUniversity className="text-lg" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-center">
        {/* Columna de Datos de Cuenta */}
        <div className="md:col-span-7 space-y-4">
          {/* Número de Cuenta con botón Copiar */}
          <div className="rounded-2xl border border-white/10 bg-[#16161A] p-4 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Número de Cuenta ({info.tipoCuenta})
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg sm:text-xl font-mono font-black text-white tracking-wide select-all">
                {info.numeroCuenta}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl bg-[#E8B86A] px-3.5 py-2 text-xs font-bold text-black hover:bg-[#D4A574] transition-colors"
                title="Copiar número de cuenta"
              >
                {copied ? (
                  <>
                    <FaCheck className="text-xs" /> Copiado
                  </>
                ) : (
                  <>
                    <FaCopy className="text-xs" /> Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Titular y Documento */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[#16161A] border border-white/5 p-3">
              <span className="text-[10px] text-white/50 block font-semibold">TITULAR:</span>
              <span className="font-bold text-white mt-0.5 block truncate">{info.titular}</span>
            </div>
            {info.documento && (
              <div className="rounded-xl bg-[#16161A] border border-white/5 p-3">
                <span className="text-[10px] text-white/50 block font-semibold">DOCUMENTO:</span>
                <span className="font-bold text-white mt-0.5 block truncate">{info.documento}</span>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          {info.instrucciones && (
            <div className="flex items-start gap-2 text-xs text-white/60 bg-[#16161A] p-3 rounded-xl border border-white/5">
              <FaInfoCircle className="text-[#E8B86A] text-xs shrink-0 mt-0.5" />
              <span>{info.instrucciones}</span>
            </div>
          )}
        </div>

        {/* Columna de QR con Fallback Elegante */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[200px] aspect-square rounded-2xl border border-white/15 bg-white p-3 flex items-center justify-center overflow-hidden relative">
            {!qrError && info.qrImageUrl ? (
              <img
                src={info.qrImageUrl}
                alt="Código QR de Pago"
                className="h-full w-full object-contain"
                onError={() => setQrError(true)}
              />
            ) : (
              /* Fallback en caso de error de carga o imagen faltante */
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-2 bg-[#0d0d10] rounded-xl text-white">
                <FaQrcode className="text-4xl text-[#E8B86A] mb-1" />
                <span className="text-[10px] font-bold text-white/80">Código QR</span>
                <span className="text-[9px] text-[#E8B86A] mt-1 font-mono">
                  {info.numeroCuenta}
                </span>
              </div>
            )}
          </div>
          <span className="mt-2 text-[10px] font-semibold text-white/40 text-center">
            Escanea desde tu app bancaria o usa el número de cuenta arriba
          </span>
        </div>
      </div>
    </div>
  );
}
