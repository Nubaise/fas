import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentEntity } from './entities/student.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity])],
})
export class StudentsModule {}
