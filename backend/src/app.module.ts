import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { StudentsModule } from './students/students.module';
import { FacultyModule } from './faculty/faculty.module';
import { AvailabilitySchedulesModule } from './availability-schedules/availability-schedules.module';
import { AvailabilityExceptionsModule } from './availability-exceptions/availability-exceptions.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationJobsModule } from './notification-jobs/notification-jobs.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        synchronize: false,
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
})
export class AppModule {}
