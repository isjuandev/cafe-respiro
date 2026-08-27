import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // Trust proxy para que req.ip respete X-Forwarded-For (Coolify/Nginx)
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  if (instance && typeof instance.set === 'function') {
    instance.set('trust proxy', 1);
  }

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}
bootstrap();
