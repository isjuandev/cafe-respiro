import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface AuthClientUser {
  usuarioId: string;
  contacto: string;
  role: 'cliente';
}

export interface AuthAdminUser {
  sub: 'admin';
  role: 'admin';
}

export type OptionalUser = AuthClientUser | AuthAdminUser | null;

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = null;

    let token: string | undefined = req.cookies?.admin_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return true; // Pasa como invitado (guest)
    }

    try {
      const secret = process.env.JWT_SECRET || 'dev-secret-min-32-chars';
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;

      // Estructuras exactas emitidas por AuthService y AdminService
      if (payload.role === 'cliente' && typeof payload.sub === 'string' && typeof payload.contacto === 'string') {
        req.user = {
          usuarioId: payload.sub,
          contacto: payload.contacto,
          role: 'cliente',
        } as AuthClientUser;
      } else if (payload.role === 'admin' && payload.sub === 'admin') {
        req.user = {
          sub: 'admin',
          role: 'admin',
        } as AuthAdminUser;
      }
    } catch {
      // Si el token está vencido o es inválido en un endpoint opcional,
      // se degrada elegantemente a guest sin bloquear la solicitud.
      req.user = null;
    }

    return true;
  }
}
