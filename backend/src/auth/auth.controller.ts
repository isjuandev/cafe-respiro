import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { AuthService } from './auth.service';
import { RegisterDto, UnifiedLoginDto } from './dto/auth.dto';

@Controller()
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('auth/registro')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto);
    this.setCookie(res, result.token);
    return { usuario: result.usuario, role: result.role };
  }

  @Post('auth/login')
  async login(@Body() dto: UnifiedLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    this.setCookie(res, result.token);
    return { ...(result.usuario ? { usuario: result.usuario } : {}), role: result.role };
  }

  @UseGuards(AuthGuard)
  @RequireRole('cliente')
  @Get('mis-reservas')
  async myReservations(@Req() req: Request) {
    const user = (req as any).user;
    return { reservas: await this.auth.findMyReservations(user.contacto) };
  }

  private setCookie(res: Response, token: string) {
    res.cookie('admin_token', token, { httpOnly: true, secure: (process.env.FRONTEND_URL || '').startsWith('https://'), sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' });
  }
}
