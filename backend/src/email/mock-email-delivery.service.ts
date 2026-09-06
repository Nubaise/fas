import { Injectable, Logger } from '@nestjs/common';

import type { EmailDelivery } from './email-delivery.interface.js';
import type { EmailMessage } from './email.types.js';

@Injectable()
export class MockEmailDeliveryService implements EmailDelivery {
  private readonly logger = new Logger(
    MockEmailDeliveryService.name,
  );

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `Mock email delivery: to=${message.to}, subject=${message.subject}, idempotencyKey=${message.idempotencyKey}`,
    );
  }
}
