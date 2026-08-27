import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeContacto } from '../common/utils/normalize';
import { AdminService } from '../admin/admin.service';
import { RegisterDto, UnifiedLoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private admin: AdminService) {}

  async register(dto: RegisterDto) {
    const contacto = normalizeContacto(dto.contacto);
    const existing = await this.prisma.usuario.findUnique({ where: { contacto } });
    if (existing) throw new ConflictException('Ya existe una cuenta con ese contacto');
    const usuario = await this.prisma.usuario.create({ data: { nombre: dto.nombre.trim(), contacto, passwordHash: await bcrypt.hash(dto.password, 12) } });
    return { usuario: this.publicUser(usuario), role: 'cliente' as const, token: this.signToken(usuario.id, 'cliente', contacto) };
  }

  async login(dto: UnifiedLoginDto) {
    if (this.admin.validateCredentials(dto.usuario, dto.password)) return { role: 'admin' as const, token: this.admin.signToken() };
    const contacto = normalizeContacto(dto.usuario);
    const usuario = await this.prisma.usuario.findUnique({ where: { contacto } });
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.passwordHash))) throw new UnauthorizedException('Usuario o contraseña incorrectos');
    return { usuario: this.publicUser(usuario), role: 'cliente' as const, token: this.signToken(usuario.id, 'cliente', contacto) };
  }

  async findMyReservations(contacto: string) {
    return this.prisma.reserva.findMany({ where: { contacto: normalizeContacto(contacto) }, include: { funcion: { include: { pelicula: true } } }, orderBy: { funcion: { fechaHora: 'asc' } } });
  }

  private signToken(sub: string, role: 'cliente', contacto: string) {
    return jwt.sign({ sub, role, contacto }, process.env.JWT_SECRET || 'dev-secret-min-32-chars', { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as any);
  }

  private publicUser(usuario: { id: string; nombre: string; contacto: string }) {
    return { id: usuario.id, nombre: usuario.nombre, contacto: usuario.contacto };
  }
}
