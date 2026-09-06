import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacultyModule } from '../faculty/faculty.module.js';
import { AvailabilityExceptionEntity } from '../availability-exceptions/entities/availability-exception.entity.js';
import { AvailabilitySchedulesController } from './availability-schedules.controller.js';
import { AvailabilitySchedulesService } from './availability-schedules.service.js';
import { AvailabilityScheduleEntity } from './entities/availability-schedule.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilityScheduleEntity,
      AvailabilityExceptionEntity,
    ]),
    FacultyModule,
  ],
  controllers: [AvailabilitySchedulesController],
  providers: [AvailabilitySchedulesService],
  exports: [AvailabilitySchedulesService],
})
export class AvailabilitySchedulesModule {}
