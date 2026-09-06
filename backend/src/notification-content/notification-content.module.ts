import { Module } from '@nestjs/common';

import { NotificationContentService } from './notification-content.service.js';

@Module({
  providers: [NotificationContentService],
  exports: [NotificationContentService],
})
export class NotificationContentModule {}
