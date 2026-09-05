import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationJobEntity } from './entities/notification-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationJobEntity])],
})
export class NotificationJobsModule {}
