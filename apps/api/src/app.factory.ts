import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ApiErrorFilter } from './shared/http/api-error.filter';

export function configureApp(app: INestApplication): INestApplication {
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
  const allowedOrigins = [frontendOrigin, frontendOrigin.replace('localhost', '127.0.0.1')];

  app.enableCors({
    origin: allowedOrigins,
  });

  app.useGlobalFilters(new ApiErrorFilter());

  return app;
}

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  return configureApp(app);
}
