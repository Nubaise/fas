import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepartmentsModule } from '../departments/departments.module.js';
import { UsersModule } from '../users/users.module.js';
import { FacultyController } from './faculty.controller.js';
import { FacultyService } from './faculty.service.js';
import { FacultyEntity } from './entities/faculty.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FacultyEntity]),
    UsersModule,
    DepartmentsModule,
  ],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
