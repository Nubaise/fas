import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Version,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { DepartmentsService } from './departments.service.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
} from './dto/department.dto.js';

@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Get()
  @Version('1')
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @Version('1')
  async findById(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @Version('1')
  @Roles('ADMIN')
  async create(
    @Body(createDepartmentSchema) body: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(body);
  }

  @Patch(':id')
  @Version('1')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body(updateDepartmentSchema) body: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @Version('1')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    await this.departmentsService.remove(id);
  }
}
