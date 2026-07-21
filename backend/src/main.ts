import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.HTTP_PORT || 3000;

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  app.setGlobalPrefix('');

  await app.listen(port);
  logger.log(`HTTP Server running on http://localhost:${port}`);
  logger.log(`TCP Plugin Server running on port ${process.env.TCP_PORT || 8888}`);
  logger.log(`Webhook endpoint: http://localhost:${port}/webhook`);
}

bootstrap();
