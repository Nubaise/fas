import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { StudentEntity } from '../students/entities/student.entity';
import { FacultyEntity } from '../faculty/entities/faculty.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  entities: [UserEntity, DepartmentEntity, StudentEntity, FacultyEntity],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
