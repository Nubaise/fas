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
import type { OnboardFacultyDto } from './dto/onboard-faculty.dto.js';
import type {
  BulkOnboardFacultyDto,
} from './dto/bulk-onboard-faculty.dto.js';
import {
  bulkOnboardFacultySchema,
} from './dto/bulk-onboard-faculty.dto.js';
import type {
  CreateFacultyDto,
  UpdateFacultyDto,
} from './dto/faculty.dto.js';
import { FacultyService } from './faculty.service.js';

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
    @Body() body: CreateFacultyDto,
  ) {
    return this.facultyService.create(body);
  }

  @Post('bulk-onboard')
  @Version('1')
  @Roles('ADMIN')
  async bulkOnboard(
    @Body({ schema: bulkOnboardFacultySchema })
    body: BulkOnboardFacultyDto,
  ) {
    return this.facultyService.bulkOnboard(body);
  }

  @Post('onboard')
  @Version('1')
  @Roles('ADMIN')
  async onboard(
    @Body() body: OnboardFacultyDto,
  ) {
    return this.facultyService.onboard(body);
  }

  @Patch(':id')
  @Version('1')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateFacultyDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.facultyService.update(
      id,
      body,
      currentUser,
    );
  }
}
