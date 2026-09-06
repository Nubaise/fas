import { Module } from '@nestjs/common';

import { MockEmailDeliveryService } from './mock-email-delivery.service.js';

export const EMAIL_DELIVERY = 'EMAIL_DELIVERY';

@Module({
  providers: [
    {
      provide: EMAIL_DELIVERY,
      useClass: MockEmailDeliveryService,
    },
  ],
  exports: [EMAIL_DELIVERY],
})
export class EmailModule {}
