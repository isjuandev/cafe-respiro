import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cafe-respiro-backend',
    };
  }
}
