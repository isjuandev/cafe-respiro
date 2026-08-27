import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminService {
  validateCredentials(username: string, password: string): boolean {
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';
    return username === expectedUser && password === expectedPass;
  }

  signToken(): string {
    const secret = process.env.JWT_SECRET || 'dev-secret-min-32-chars';
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    return jwt.sign({ sub: 'admin', role: 'admin' }, secret, { expiresIn } as any);
  }

  verifyToken(token: string) {
    const secret = process.env.JWT_SECRET || 'dev-secret-min-32-chars';
    return jwt.verify(token, secret);
  }
}
