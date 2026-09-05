import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { StudentEntity } from '../students/entities/student.entity';
import { FacultyEntity } from '../faculty/entities/faculty.entity';
import { AvailabilityScheduleEntity } from '../availability-schedules/entities/availability-schedule.entity';
import { AvailabilityExceptionEntity } from '../availability-exceptions/entities/availability-exception.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { NotificationJobEntity } from '../notification-jobs/entities/notification-job.entity';
import { NotificationEntity } from '../notifications/entities/notification.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  entities: [
    UserEntity, 
    DepartmentEntity, 
    StudentEntity, 
    FacultyEntity,
    AvailabilityScheduleEntity,
    AvailabilityExceptionEntity,
    AppointmentEntity,
    NotificationJobEntity,
    NotificationEntity,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
