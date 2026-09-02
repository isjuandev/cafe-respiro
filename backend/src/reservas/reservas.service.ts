import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { normalizeContacto } from '../common/utils/normalize';
import { Prisma, ReservaEstado } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfiguracionPagoService } from '../configuracion-pago/configuracion-pago.service';
import {
  generarCodigoReserva,
  generarWhatsAppUrl,
  getEstadoEfectivo,
  getFiltroCuposOcupados,
} from './reservas.utils';
import { OptionalUser } from '../common/guards/optional-auth.guard';

@Injectable()
export class ReservasService {
  private logger = new Logger(ReservasService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private configPagoService: ConfiguracionPagoService,
  ) {}

  async reservar(
    funcionId: string,
    dto: CreateReservaDto,
    authUser: OptionalUser,
  ) {
    const rawContacto = dto.contacto || (authUser && 'contacto' in authUser ? authUser.contacto : null);
    if (!rawContacto) {
      throw new BadRequestException('El número de contacto/WhatsApp es obligatorio');
    }
    const contactoNormalizado = normalizeContacto(rawContacto);
    const nombre = dto.nombre?.trim() || 'Cliente';
    const email = dto.email?.trim() || null;
    const usuarioId = authUser && 'usuarioId' in authUser ? authUser.usuarioId : null;

    // 1. Resolver items de entrada y totales
    let itemsToCreate: Array<{
      tipoEntradaId: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      nombreTipo: string;
    }> = [];

    if (dto.items && dto.items.length > 0) {
      const tipoIds = dto.items.map((i) => i.tipoEntradaId);
      const tiposDb = await this.prisma.tipoEntrada.findMany({
        where: { id: { in: tipoIds }, activo: true },
      });
      const tipoMap = new Map(tiposDb.map((t) => [t.id, t]));

      for (const itemDto of dto.items) {
        if (itemDto.cantidad <= 0) continue;
        const tipo = tipoMap.get(itemDto.tipoEntradaId);
        if (!tipo) {
          throw new BadRequestException(`Tipo de entrada no válido o inactivo: ${itemDto.tipoEntradaId}`);
        }
        itemsToCreate.push({
          tipoEntradaId: tipo.id,
          cantidad: itemDto.cantidad,
          precioUnitario: tipo.precio,
          subtotal: itemDto.cantidad * tipo.precio,
          nombreTipo: tipo.nombre,
        });
      }
    }

    // Fallback retrocompatible si no enviaron items pero sí cantidad
    if (itemsToCreate.length === 0) {
      const cantidad = dto.cantidad && dto.cantidad > 0 ? dto.cantidad : 1;
      let tipoGeneral = await this.prisma.tipoEntrada.findFirst({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      });
      if (!tipoGeneral) {
        tipoGeneral = await this.prisma.tipoEntrada.create({
          data: {
            id: 'tipo_esencial',
            nombre: 'Esencial',
            precio: 15000,
            descripcion: 'Entrada general a la función',
            orden: 1,
            activo: true,
          },
        });
      }
      itemsToCreate.push({
        tipoEntradaId: tipoGeneral.id,
        cantidad,
        precioUnitario: tipoGeneral.precio,
        subtotal: cantidad * tipoGeneral.precio,
        nombreTipo: tipoGeneral.nombre,
      });
    }

    const totalCupos = itemsToCreate.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrecio = itemsToCreate.reduce((sum, item) => sum + item.subtotal, 0);

    if (totalCupos === 0) {
      throw new BadRequestException('Debes seleccionar al menos una entrada');
    }

    const ahora = new Date();
    // Expiración por defecto en 25 minutos
    const expiraEn = new Date(ahora.getTime() + 25 * 60 * 1000);

    // 2. Transacción pesimista con lock
    const result = await this.prisma.$transaction(async (tx) => {
      // Lock pesimista sobre la función
      const rows = await tx.$queryRaw<Array<{ id: string; cupoTotal: number; fechaHora: Date }>>`
        SELECT id, "cupoTotal", "fechaHora" FROM "Funcion" WHERE id = ${funcionId} FOR UPDATE
      `;
      if (rows.length === 0) {
        throw new NotFoundException('Función no encontrada');
      }
      const funcionDb = rows[0];
      if (new Date(funcionDb.fechaHora) <= ahora) {
        throw new ConflictException('No se puede reservar una función pasada');
      }

      // 2.1. Validar si ya existe reserva PENDIENTE_PAGO para este (funcionId, contacto)
      const pendienteExistente = await tx.reserva.findFirst({
        where: {
          funcionId,
          contacto: contactoNormalizado,
          estado: ReservaEstado.PENDIENTE_PAGO,
        },
      });

      if (pendienteExistente) {
        const sigueActiva = new Date(pendienteExistente.expiraEn) > ahora;
        if (sigueActiva) {
          throw new ConflictException(
            `Ya tienes una reserva pendiente de pago para esta función (Código: ${pendienteExistente.codigo}). ` +
            `Completa el pago o espera a que expire antes de realizar otra.`
          );
        }
        // Cleanup silencioso interno para liberar el slot del índice único parcial
        await tx.reserva.update({
          where: { id: pendienteExistente.id },
          data: { estado: ReservaEstado.CANCELADA },
        });
      }

      // 2.2. Conteo de cupos activos dentro de la transacción
      const agg = await tx.reserva.aggregate({
        _sum: { cantidad: true },
        where: {
          funcionId,
          ...getFiltroCuposOcupados(ahora),
        },
      });
      const ocupados = agg._sum.cantidad ?? 0;
      const disponibles = funcionDb.cupoTotal - ocupados;

      if (disponibles < totalCupos) {
        throw new ConflictException(
          disponibles <= 0
            ? 'Cupo agotado para esta función'
            : `Cupo insuficiente: solo quedan ${disponibles} entradas disponibles`
        );
      }

      // 2.3. Crear reserva con código único
      let codigo = generarCodigoReserva();
      // Garantizar unicidad de código
      let intentos = 0;
      while (intentos < 5) {
        const dup = await tx.reserva.findUnique({ where: { codigo } });
        if (!dup) break;
        codigo = generarCodigoReserva();
        intentos++;
      }

      const reserva = await tx.reserva.create({
        data: {
          codigo,
          funcionId,
          usuarioId,
          nombre,
          contacto: contactoNormalizado,
          email,
          cantidad: totalCupos,
          total: totalPrecio,
          estado: ReservaEstado.PENDIENTE_PAGO,
          expiraEn,
          items: {
            create: itemsToCreate.map((item) => ({
              tipoEntradaId: item.tipoEntradaId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: {
            include: { tipoEntrada: true },
          },
          funcion: {
            include: { pelicula: true },
          },
        },
      });

      return {
        reserva,
        cuposDisponibles: disponibles - totalCupos,
        cuposOcupados: ocupados + totalCupos,
      };
    });

    // 3. Obtener configuración de pago para generar datos y WhatsApp URL
    const configPago = await this.configPagoService.getConfiguracion();
    const whatsappUrl = generarWhatsAppUrl(
      {
        codigo: result.reserva.codigo,
        total: result.reserva.total,
        nombre: result.reserva.nombre,
        funcion: result.reserva.funcion,
      },
      configPago.telefonoWp
    );

    // 4. Notificación post-commit segura (Reserva registrada)
    this.notifications
      .notifyReservaRegistrada(result.reserva, result.reserva.funcion)
      .catch((e) => this.logger.warn(`notifyReservaRegistrada falló: ${e}`));

    return {
      ok: true,
      reserva: {
        id: result.reserva.id,
        codigo: result.reserva.codigo,
        estado: getEstadoEfectivo(result.reserva),
        expiraEn: result.reserva.expiraEn,
        nombre: result.reserva.nombre,
        contacto: result.reserva.contacto,
        email: result.reserva.email,
        cantidad: result.reserva.cantidad,
        total: result.reserva.total,
        items: result.reserva.items.map((i) => ({
          tipoEntrada: i.tipoEntrada.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
        })),
        funcion: {
          id: result.reserva.funcion.id,
          fechaHora: result.reserva.funcion.fechaHora,
          pelicula: {
            titulo: result.reserva.funcion.pelicula.titulo,
            posterUrl: result.reserva.funcion.pelicula.posterUrl,
          },
        },
      },
      pagoInfo: {
        banco: configPago.banco,
        tipoCuenta: configPago.tipoCuenta,
        numeroCuenta: configPago.numeroCuenta,
        titular: configPago.titular,
        documento: configPago.documento,
        qrImageUrl: configPago.qrImageUrl,
        instrucciones: configPago.instrucciones,
      },
      whatsappUrl,
    };
  }

  async findByCodigo(codigo: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { codigo: codigo.trim().toUpperCase() },
      include: {
        items: { include: { tipoEntrada: true } },
        funcion: { include: { pelicula: true } },
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const estadoEfectivo = getEstadoEfectivo(reserva);
    const configPago = await this.configPagoService.getConfiguracion();
    const whatsappUrl = generarWhatsAppUrl(
      {
        codigo: reserva.codigo,
        total: reserva.total,
        nombre: reserva.nombre,
        funcion: reserva.funcion,
      },
      configPago.telefonoWp
    );

    return {
      id: reserva.id,
      codigo: reserva.codigo,
      estado: estadoEfectivo,
      estadoOriginal: reserva.estado,
      expiraEn: reserva.expiraEn,
      nombre: reserva.nombre,
      contacto: reserva.contacto,
      email: reserva.email,
      cantidad: reserva.cantidad,
      total: reserva.total,
      confirmadoEn: reserva.confirmadoEn,
      createdAt: reserva.createdAt,
      items: reserva.items.map((i) => ({
        tipoEntrada: i.tipoEntrada.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.subtotal,
      })),
      funcion: {
        id: reserva.funcion.id,
        fechaHora: reserva.funcion.fechaHora,
        pelicula: {
          titulo: reserva.funcion.pelicula.titulo,
          posterUrl: reserva.funcion.pelicula.posterUrl,
          duracionMin: reserva.funcion.pelicula.duracionMin,
        },
      },
      pagoInfo: {
        banco: configPago.banco,
        tipoCuenta: configPago.tipoCuenta,
        numeroCuenta: configPago.numeroCuenta,
        titular: configPago.titular,
        documento: configPago.documento,
        qrImageUrl: configPago.qrImageUrl,
        instrucciones: configPago.instrucciones,
      },
      whatsappUrl,
    };
  }

  async consultarPublicas(criterio: string) {
    if (!criterio || criterio.trim().length < 3) {
      throw new BadRequestException('El criterio de búsqueda debe tener al menos 3 caracteres');
    }

    const limpio = criterio.trim();
    const codigoQuery = limpio.toUpperCase();
    const contactoNorm = normalizeContacto(limpio);
    const emailQuery = limpio.toLowerCase();

    const ahora = new Date();
    const orFilters: any[] = [
      { codigo: codigoQuery },
      { contacto: contactoNorm },
      { contacto: limpio },
      { email: emailQuery },
    ];

    if (contactoNorm !== limpio) {
      orFilters.push({ email: contactoNorm });
    }

    const reservas = await this.prisma.reserva.findMany({
      where: {
        OR: orFilters,
      },
      include: {
        items: { include: { tipoEntrada: true } },
        funcion: { include: { pelicula: true } },
      },
      orderBy: { funcion: { fechaHora: 'desc' } },
      take: 20,
    });

    return reservas.map((reserva) => {
      const estadoEfectivo = getEstadoEfectivo(reserva, ahora);
      return {
        id: reserva.id,
        codigo: reserva.codigo,
        estado: estadoEfectivo,
        estadoOriginal: reserva.estado,
        expiraEn: reserva.expiraEn,
        nombre: reserva.nombre,
        contacto: reserva.contacto,
        email: reserva.email,
        cantidad: reserva.cantidad,
        total: reserva.total,
        confirmadoEn: reserva.confirmadoEn,
        createdAt: reserva.createdAt,
        items: reserva.items.map((i) => ({
          tipoEntrada: i.tipoEntrada.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
        })),
        funcion: {
          id: reserva.funcion.id,
          fechaHora: reserva.funcion.fechaHora,
          pelicula: {
            titulo: reserva.funcion.pelicula.titulo,
            posterUrl: reserva.funcion.pelicula.posterUrl,
            duracionMin: reserva.funcion.pelicula.duracionMin,
          },
        },
      };
    });
  }

  async confirmarPago(reservaId: string, adminSub: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        funcion: { include: { pelicula: true } },
        items: { include: { tipoEntrada: true } },
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado === ReservaEstado.CONFIRMADA) {
      return { ok: true, reserva, message: 'La reserva ya estaba confirmada' };
    }

    if (reserva.estado === ReservaEstado.CANCELADA) {
      throw new ConflictException('No se puede confirmar el pago de una reserva cancelada');
    }

    const ahora = new Date();
    const actualizada = await this.prisma.reserva.update({
      where: { id: reservaId },
      data: {
        estado: ReservaEstado.CONFIRMADA,
        confirmadoPorAdminId: adminSub || 'admin',
        confirmadoEn: ahora,
      },
      include: {
        funcion: { include: { pelicula: true } },
        items: { include: { tipoEntrada: true } },
      },
    });

    // Notificación post-commit (Pago confirmado)
    this.notifications
      .notifyPagoConfirmado(actualizada, actualizada.funcion)
      .catch((e) => this.logger.warn(`notifyPagoConfirmado falló: ${e}`));

    return {
      ok: true,
      reserva: {
        id: actualizada.id,
        codigo: actualizada.codigo,
        estado: ReservaEstado.CONFIRMADA,
        confirmadoEn: actualizada.confirmadoEn,
        confirmadoPorAdminId: actualizada.confirmadoPorAdminId,
      },
    };
  }

  async cancelar(reservaId: string, authUser: { contacto?: string; role?: string; sub?: string }) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { funcion: { include: { pelicula: true } } },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado === ReservaEstado.CANCELADA) {
      throw new ConflictException('La reserva ya se encuentra cancelada');
    }

    const ahora = new Date();
    const fechaFuncion = new Date(reserva.funcion.fechaHora);
    const diffMs = fechaFuncion.getTime() - ahora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0) {
      throw new ConflictException('No se puede cancelar una reserva para una función que ya ha iniciado o pasado');
    }

    if (authUser.role !== 'admin') {
      const isOwner =
        (reserva.usuarioId && reserva.usuarioId === authUser.sub) ||
        normalizeContacto(reserva.contacto) === normalizeContacto(authUser.contacto || '') ||
        (reserva.email && authUser.contacto && reserva.email.toLowerCase() === authUser.contacto.toLowerCase());

      if (!isOwner) {
        throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
      }

      // Regla de negocio: Mínimo 4 horas de anticipación a la función
      if (diffHoras < 4) {
        throw new ConflictException(
          'Las cancelaciones solo se permiten con un mínimo de 4 horas de anticipación al inicio de la función. Para casos especiales, comunícate directamente con Café Respiro.'
        );
      }
    }

    const cancelada = await this.prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: ReservaEstado.CANCELADA },
    });

    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'RESERVA_CANCELADA',
          destinatario: reserva.contacto,
          payload: {
            reservaId: reserva.id,
            codigo: reserva.codigo,
            funcionId: reserva.funcionId,
            pelicula: reserva.funcion.pelicula?.titulo,
            cantidad: reserva.cantidad,
            canceladoPor: authUser?.role || 'cliente',
          } as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog cancelada falló: ${e}`);
    }

    this.logger.log(`Reserva ${reserva.codigo} (${reserva.id}) cancelada por ${authUser?.role || 'cliente'}. ${reserva.cantidad} cupos liberados.`);

    return {
      ok: true,
      message: 'Reserva cancelada exitosamente',
      funcionId: reserva.funcionId,
      cuposLiberados: reserva.cantidad,
    };
  }

  async cancelarPorCodigo(codigo: string) {
    const cleanCodigo = codigo.trim().toUpperCase();
    const reserva = await this.prisma.reserva.findUnique({
      where: { codigo: cleanCodigo },
      include: { funcion: { include: { pelicula: true } } },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado === ReservaEstado.CANCELADA) {
      throw new ConflictException('Esta reserva ya se encuentra cancelada');
    }

    const ahora = new Date();
    const fechaFuncion = new Date(reserva.funcion.fechaHora);
    const diffMs = fechaFuncion.getTime() - ahora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0) {
      throw new ConflictException('No se puede cancelar una reserva para una función que ya ha iniciado o pasado');
    }

    if (diffHoras < 4) {
      throw new ConflictException(
        'Las cancelaciones solo se permiten con un mínimo de 4 horas de anticipación al inicio de la función. Para casos especiales, comunícate directamente con Café Respiro.'
      );
    }

    await this.prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado: ReservaEstado.CANCELADA },
    });

    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'RESERVA_CANCELADA',
          destinatario: reserva.contacto,
          payload: {
            reservaId: reserva.id,
            codigo: reserva.codigo,
            funcionId: reserva.funcionId,
            pelicula: reserva.funcion.pelicula?.titulo,
            cantidad: reserva.cantidad,
            canceladoPor: 'cliente_por_codigo',
          } as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog cancelada por código falló: ${e}`);
    }

    this.logger.log(`Reserva ${reserva.codigo} cancelada por código. ${reserva.cantidad} cupos liberados.`);

    return {
      ok: true,
      message: 'Reserva cancelada exitosamente',
      codigo: reserva.codigo,
      funcionId: reserva.funcionId,
      cuposLiberados: reserva.cantidad,
    };
  }
}
