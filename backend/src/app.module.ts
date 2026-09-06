import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { envSchema } from './config/env.validation.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { StudentsModule } from './students/students.module.js';
import { FacultyModule } from './faculty/faculty.module.js';
import { AvailabilitySchedulesModule } from './availability-schedules/availability-schedules.module.js';
import { AvailabilityExceptionsModule } from './availability-exceptions/availability-exceptions.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { NotificationJobsModule } from './notification-jobs/notification-jobs.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),

    AuthModule,
    UsersModule,
    DepartmentsModule,
    StudentsModule,
    FacultyModule,
    AvailabilitySchedulesModule,
    AvailabilityExceptionsModule,
    AppointmentsModule,
    NotificationJobsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
