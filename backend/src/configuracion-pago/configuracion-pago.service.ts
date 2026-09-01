import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateConfiguracionPagoDto {
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  titular?: string;
  documento?: string;
  qrImageUrl?: string;
  telefonoWp?: string;
  instrucciones?: string;
}

@Injectable()
export class ConfiguracionPagoService {
  constructor(private prisma: PrismaService) {}

  async getConfiguracion() {
    let config = await this.prisma.configuracionPago.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await this.prisma.configuracionPago.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          banco: 'Bancolombia',
          tipoCuenta: 'Ahorros',
          numeroCuenta: '123-456789-01',
          titular: 'Café Respiro S.A.S.',
          documento: 'NIT 901.234.567-8',
          qrImageUrl: '/images/pago-qr.png',
          telefonoWp: '573001234567',
          instrucciones:
            'Realiza la transferencia por el valor exacto y envía el comprobante por WhatsApp indicando tu código de reserva.',
        },
        update: {},
      });
    }

    return {
      banco: config.banco,
      tipoCuenta: config.tipoCuenta,
      numeroCuenta: config.numeroCuenta,
      titular: config.titular,
      documento: config.documento,
      qrImageUrl: config.qrImageUrl,
      telefonoWp: config.telefonoWp,
      instrucciones: config.instrucciones,
    };
  }

  async updateConfiguracion(dto: UpdateConfiguracionPagoDto) {
    const config = await this.prisma.configuracionPago.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        banco: dto.banco ?? 'Bancolombia',
        tipoCuenta: dto.tipoCuenta ?? 'Ahorros',
        numeroCuenta: dto.numeroCuenta ?? '123-456789-01',
        titular: dto.titular ?? 'Café Respiro S.A.S.',
        documento: dto.documento ?? 'NIT 901.234.567-8',
        qrImageUrl: dto.qrImageUrl ?? '/images/pago-qr.png',
        telefonoWp: dto.telefonoWp ?? '573001234567',
        instrucciones: dto.instrucciones,
      },
      update: {
        ...(dto.banco && { banco: dto.banco }),
        ...(dto.tipoCuenta && { tipoCuenta: dto.tipoCuenta }),
        ...(dto.numeroCuenta && { numeroCuenta: dto.numeroCuenta }),
        ...(dto.titular && { titular: dto.titular }),
        ...(dto.documento !== undefined && { documento: dto.documento }),
        ...(dto.qrImageUrl !== undefined && { qrImageUrl: dto.qrImageUrl }),
        ...(dto.telefonoWp && { telefonoWp: dto.telefonoWp }),
        ...(dto.instrucciones !== undefined && { instrucciones: dto.instrucciones }),
      },
    });

    return config;
  }
}
