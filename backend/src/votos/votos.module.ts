import { Module } from '@nestjs/common';
import { VotosService } from './votos.service';
import { VotosController } from './votos.controller';
import { VotacionesModule } from '../votaciones/votaciones.module';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';
import { VotosRateLimitGuard } from '../common/rate-limit/votos-rate-limit.guard';
import { CaptchaService } from '../common/captcha/captcha.service';

@Module({
  imports: [VotacionesModule],
  controllers: [VotosController],
  providers: [VotosService, RateLimitService, VotosRateLimitGuard, CaptchaService],
})
export class VotosModule {}
