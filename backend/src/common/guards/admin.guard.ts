import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    // 1. Cookie httpOnly
    let token: string | undefined = req.cookies?.admin_token;
    // 2. Fallback Bearer
    if (!token) {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) throw new UnauthorizedException('No autenticado');

    const secret = process.env.JWT_SECRET || 'dev-secret-min-32-chars';
    try {
      const payload = jwt.verify(token, secret) as any;
      if (payload.sub !== 'admin') throw new UnauthorizedException('Token inválido');
      req.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Sesión expirada o inválida');
    }
  }
}
