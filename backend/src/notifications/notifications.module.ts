import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationEntity } from './entities/notification.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
})
export class NotificationsModule {}
