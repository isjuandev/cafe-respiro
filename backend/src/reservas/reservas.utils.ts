import { Reserva, ReservaEstado, Prisma } from '@prisma/client';

export type EstadoEfectivoReserva = 'PENDIENTE_PAGO' | 'CONFIRMADA' | 'CANCELADA' | 'VENCIDA';

/**
 * Determina el estado efectivo de una reserva en tiempo de ejecución.
 * Si está en PENDIENTE_PAGO pero su fecha límite expiraEn ya pasó,
 * se deriva a 'VENCIDA' para efectos de cupos, UI y reglas de negocio.
 */
export function getEstadoEfectivo(
  reserva: Pick<Reserva, 'estado' | 'expiraEn'>,
  ahora: Date = new Date()
): EstadoEfectivoReserva {
  if (reserva.estado === ReservaEstado.PENDIENTE_PAGO && new Date(reserva.expiraEn) <= ahora) {
    return 'VENCIDA';
  }
  return reserva.estado as EstadoEfectivoReserva;
}

/**
 * Filtro estándar reutilizable de Prisma para identificar reservas
 * que actualmente retienen cupos en una función.
 * Aplica a reservas CONFIRMADA o PENDIENTE_PAGO que no hayan expirado.
 */
export function getFiltroCuposOcupados(ahora: Date = new Date()): Prisma.ReservaWhereInput {
  return {
    OR: [
      { estado: ReservaEstado.CONFIRMADA },
      {
        estado: ReservaEstado.PENDIENTE_PAGO,
        expiraEn: { gt: ahora },
      },
    ],
  };
}

/**
 * Genera un código de reserva amigable con formato CIN-XXXXX
 * usando un alfabeto de 32 caracteres legibles (sin 0/O, 1/I).
 */
export function generarCodigoReserva(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    randomStr += chars[idx];
  }
  return `CIN-${randomStr}`;
}

/**
 * Construye el deep link oficial de WhatsApp para enviar el comprobante de pago.
 */
export function generarWhatsAppUrl(
  reserva: {
    codigo: string;
    total: number;
    nombre: string;
    funcion?: { fechaHora: Date; pelicula?: { titulo: string } };
  },
  telefonoWp: string
): string {
  const peliculaTitulo = reserva.funcion?.pelicula?.titulo || 'Función de Cine';
  const totalFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(reserva.total);

  const cleanPhone = telefonoWp.replace(/[^0-9]/g, '');
  const texto =
    `¡Hola Café Respiro! Adjunto el comprobante de pago para mi reserva *${reserva.codigo}*.\n\n` +
    `🎬 Película: ${peliculaTitulo}\n` +
    `👤 A nombre de: ${reserva.nombre}\n` +
    `💰 Total: ${totalFormateado}\n\n` +
    `Quedo atento a la confirmación de mis entradas. ¡Gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`;
}
