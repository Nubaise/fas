import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepartmentEntity } from './entities/department.entity.js';
import { DepartmentsController } from './departments.controller.js';
import { DepartmentsService } from './departments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
