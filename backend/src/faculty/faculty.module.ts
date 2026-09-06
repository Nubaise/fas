import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacultyEntity } from './entities/faculty.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([FacultyEntity])],
})
export class FacultyModule {}
