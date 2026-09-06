import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentEntity } from './entities/appointment.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentEntity])],
})
export class AppointmentsModule {}
