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

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  createAvailabilityExceptionSchema,
  updateAvailabilityExceptionSchema,
} from './dto/availability-exception.dto.js';
import { AvailabilityExceptionsService } from './availability-exceptions.service.js';

@Controller('availability-exceptions')
export class AvailabilityExceptionsController {
  constructor(
    private readonly availabilityExceptionsService: AvailabilityExceptionsService,
  ) {}

  @Get('faculty/:facultyId')
  @Version('1')
  async findAllForFaculty(
    @Param('facultyId') facultyId: string,
  ) {
    return this.availabilityExceptionsService.findAllForFaculty(
      facultyId,
    );
  }

  @Get(':id')
  @Version('1')
  async findById(@Param('id') id: string) {
    return this.availabilityExceptionsService.findById(id);
  }

  @Post()
  @Version('1')
  @Roles('FACULTY', 'ADMIN')
  async create(
    @Body(createAvailabilityExceptionSchema)
    body: typeof createAvailabilityExceptionSchema['_output'],
    @CurrentUser()
    currentUser: {
      id: string;
      role: 'STUDENT' | 'FACULTY' | 'ADMIN';
    },
  ) {
    return this.availabilityExceptionsService.create(
      body,
      currentUser,
    );
  }

  @Patch(':id')
  @Version('1')
  @Roles('FACULTY', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body(updateAvailabilityExceptionSchema)
    body: typeof updateAvailabilityExceptionSchema['_output'],
    @CurrentUser()
    currentUser: {
      id: string;
      role: 'STUDENT' | 'FACULTY' | 'ADMIN';
    },
  ) {
    return this.availabilityExceptionsService.update(
      id,
      body,
      currentUser,
    );
  }

  @Delete(':id')
  @Version('1')
  @Roles('FACULTY', 'ADMIN')
  async remove(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: {
      id: string;
      role: 'STUDENT' | 'FACULTY' | 'ADMIN';
    },
  ): Promise<void> {
    await this.availabilityExceptionsService.remove(
      id,
      currentUser,
    );
  }
}
