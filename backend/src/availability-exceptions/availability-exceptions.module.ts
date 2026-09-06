import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AvailabilityExceptionEntity } from './entities/availability-exception.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilityExceptionEntity])],
})
export class AvailabilityExceptionsModule {}
