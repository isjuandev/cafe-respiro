import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

export type AuthRole = 'admin' | 'cliente';
export const AUTH_ROLES_KEY = 'auth_roles';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    let token: string | undefined = req.cookies?.admin_token;
    if (!token) {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) throw new UnauthorizedException('No autenticado');

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-min-32-chars') as jwt.JwtPayload;
      const role: AuthRole | undefined = payload.role === 'admin' || payload.role === 'cliente' ? payload.role : payload.sub === 'admin' ? 'admin' : undefined;
      if (!role) throw new UnauthorizedException('Token inválido');
      const required = this.reflector.getAllAndOverride<AuthRole[]>(AUTH_ROLES_KEY, [context.getHandler(), context.getClass()]);
      if (required && !required.includes(role)) throw new ForbiddenException('No tienes permisos para esta acción');
      req.user = { ...payload, role };
      if (role === 'admin') req.admin = req.user;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Sesión expirada o inválida');
    }
  }
}
