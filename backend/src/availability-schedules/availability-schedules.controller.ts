import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  availabilityDateSchema,
  createAvailabilityScheduleSchema,
  updateAvailabilityScheduleSchema,
} from './dto/availability-schedule.dto.js';
import { AvailabilitySchedulesService } from './availability-schedules.service.js';

@Controller('availability-schedules')
export class AvailabilitySchedulesController {
  constructor(
    private readonly availabilitySchedulesService: AvailabilitySchedulesService,
  ) {}

  @Get('faculty/:facultyId')
  @Version('1')
  async findAllForFaculty(
    @Param('facultyId') facultyId: string,
  ) {
    return this.availabilitySchedulesService.findAllForFaculty(
      facultyId,
    );
  }

  @Get('faculty/:facultyId/availability')
  @Version('1')
  async getAvailableSlots(
    @Param('facultyId') facultyId: string,
    @Query('date', availabilityDateSchema)
    date: string,
  ) {
    return this.availabilitySchedulesService.getAvailableSlots(
      facultyId,
      date,
    );
  }

  @Get(':id')
  @Version('1')
  async findById(@Param('id') id: string) {
    return this.availabilitySchedulesService.findById(id);
  }

  @Post()
  @Version('1')
  @Roles('FACULTY', 'ADMIN')
  async create(
    @Body(createAvailabilityScheduleSchema)
    body: typeof createAvailabilityScheduleSchema['_output'],
    @CurrentUser()
    currentUser: {
      id: string;
      role: 'STUDENT' | 'FACULTY' | 'ADMIN';
    },
  ) {
    return this.availabilitySchedulesService.create(
      body,
      currentUser,
    );
  }

  @Patch(':id')
  @Version('1')
  @Roles('FACULTY', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body(updateAvailabilityScheduleSchema)
    body: typeof updateAvailabilityScheduleSchema['_output'],
    @CurrentUser()
    currentUser: {
      id: string;
      role: 'STUDENT' | 'FACULTY' | 'ADMIN';
    },
  ) {
    return this.availabilitySchedulesService.update(
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
    await this.availabilitySchedulesService.remove(
      id,
      currentUser,
    );
  }
}
