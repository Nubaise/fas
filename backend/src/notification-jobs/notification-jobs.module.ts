import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentEntity } from '../appointments/entities/appointment.entity.js';
import { EmailModule } from '../email/email.module.js';
import { NotificationContentModule } from '../notification-content/notification-content.module.js';
import { NotificationEntity } from '../notifications/entities/notification.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { NotificationJobEntity } from './entities/notification-job.entity.js';
import { NotificationJobsService } from './notification-jobs.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationJobEntity,
      NotificationEntity,
      AppointmentEntity,
      UserEntity,
    ]),
    EmailModule,
    NotificationContentModule,
  ],
  providers: [NotificationJobsService],
  exports: [NotificationJobsService],
})
export class NotificationJobsModule {}
