import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { NotificationJobsService } from '../notification-jobs/notification-jobs.service.js';

const POLL_INTERVAL_MS = 1_000;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const notificationJobsService =
    app.get(NotificationJobsService);

  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    await app.close();
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  while (!shuttingDown) {
    const processed =
      await notificationJobsService.processNext();

    if (!processed) {
      await new Promise((resolve) =>
        setTimeout(resolve, POLL_INTERVAL_MS),
      );
    }
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
