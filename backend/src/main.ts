import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import {
  StandardSchemaValidationPipe,
  VersioningType,
} from '@nestjs/common';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);

  await app.listen(configService.getOrThrow<number>('PORT'));
}

bootstrap();
