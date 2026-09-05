import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AvailabilityScheduleEntity } from './entities/availability-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilityScheduleEntity])],
})
export class AvailabilitySchedulesModule {}
