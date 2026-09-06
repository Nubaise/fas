import 'reflect-metadata';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity.js';
import { DepartmentEntity } from '../departments/entities/department.entity.js';
import { StudentEntity } from '../students/entities/student.entity.js';
import { FacultyEntity } from '../faculty/entities/faculty.entity.js';
import { AvailabilityScheduleEntity } from '../availability-schedules/entities/availability-schedule.entity.js';
import { AvailabilityExceptionEntity } from '../availability-exceptions/entities/availability-exception.entity.js';
import { AppointmentEntity } from '../appointments/entities/appointment.entity.js';
import { NotificationJobEntity } from '../notification-jobs/entities/notification-job.entity.js';
import { NotificationEntity } from '../notifications/entities/notification.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
