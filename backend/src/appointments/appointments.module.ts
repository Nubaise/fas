import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AvailabilitySchedulesModule } from '../availability-schedules/availability-schedules.module.js';
import { FacultyEntity } from '../faculty/entities/faculty.entity.js';
import { FacultyModule } from '../faculty/faculty.module.js';
import { NotificationJobEntity } from '../notification-jobs/entities/notification-job.entity.js';
import { StudentEntity } from '../students/entities/student.entity.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentEntity } from './entities/appointment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      StudentEntity,
      FacultyEntity,
      NotificationJobEntity,
    ]),
    FacultyModule,
    AvailabilitySchedulesModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
