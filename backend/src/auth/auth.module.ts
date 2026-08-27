import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({ imports: [AdminModule], controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
