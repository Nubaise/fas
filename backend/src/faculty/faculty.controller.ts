import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Version,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { FacultyService } from './faculty.service.js';
import {
  createFacultySchema,
  updateFacultySchema,
  type CreateFacultyDto,
  type UpdateFacultyDto,
} from './dto/faculty.dto.js';

type CurrentUserPayload = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

@Controller('faculty')
export class FacultyController {
  constructor(
    private readonly facultyService: FacultyService,
  ) {}

  @Get()
  @Version('1')
  async findAll() {
    return this.facultyService.findAll();
  }

  @Get(':id')
  @Version('1')
  async findById(@Param('id') id: string) {
    return this.facultyService.findById(id);
  }

  @Post()
  @Version('1')
  @Roles('ADMIN')
  async create(
    @Body(createFacultySchema) body: CreateFacultyDto,
  ) {
    return this.facultyService.create(body);
  }

  @Patch(':id')
  @Version('1')
  async update(
    @Param('id') id: string,
    @Body(updateFacultySchema) body: UpdateFacultyDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.facultyService.update(
      id,
      body,
      currentUser,
    );
  }
}
