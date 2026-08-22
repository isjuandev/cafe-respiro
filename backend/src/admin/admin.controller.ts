import { Controller, Post, Get, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AdminService } from './admin.service';
import { LoginDto } from './dto/login.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const ok = this.adminService.validateCredentials(dto.username, dto.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.adminService.signToken();
    // Secure solo si FRONTEND_URL es https, para que localhost http funcione
    const secure = (process.env.FRONTEND_URL || '').startsWith('https://');
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true, token }; // token también para debug / Bearer
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_token', { path: '/' });
    return { ok: true };
  }

  @UseGuards(AdminGuard)
  @Get('me')
  async me(@Req() req: Request) {
    return { authenticated: true, admin: (req as any).admin };
  }
}
