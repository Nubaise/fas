import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacultyModule } from '../faculty/faculty.module.js';
import { AvailabilityExceptionsController } from './availability-exceptions.controller.js';
import { AvailabilityExceptionsService } from './availability-exceptions.service.js';
import { AvailabilityExceptionEntity } from './entities/availability-exception.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilityExceptionEntity]),
    FacultyModule,
  ],
  controllers: [AvailabilityExceptionsController],
  providers: [AvailabilityExceptionsService],
  exports: [AvailabilityExceptionsService],
})
export class AvailabilityExceptionsModule {}
