import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
  const allowedOrigins = [frontendOrigin, frontendOrigin.replace('localhost', '127.0.0.1')];

  app.enableCors({
    origin: allowedOrigins,
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
