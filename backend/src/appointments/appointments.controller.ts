import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Version,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AppointmentsService } from './appointments.service.js';
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  type CreateAppointmentDto,
  type RescheduleAppointmentDto,
} from './dto/appointment.dto.js';

type CurrentUserPayload = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  @Version('1')
  async create(
    @Body(createAppointmentSchema)
    body: CreateAppointmentDto,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.create(
      body,
      currentUser,
    );
  }

  @Get()
  @Version('1')
  async findAll(
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.findAll(
      currentUser,
    );
  }

  @Get(':id')
  @Version('1')
  async findById(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.findById(
      id,
      currentUser,
    );
  }

  @Post(':id/accept')
  @Version('1')
  async accept(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.accept(
      id,
      currentUser,
    );
  }

  @Post(':id/reject')
  @Version('1')
  async reject(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.reject(
      id,
      currentUser,
    );
  }


  @Post(':id/cancel')
  @Version('1')
  async cancel(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.cancel(
      id,
      currentUser,
    );
  }

  @Post(':id/reschedule')
  @Version('1')
  async reschedule(
    @Param('id') id: string,
    @Body(rescheduleAppointmentSchema)
    body: RescheduleAppointmentDto,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.reschedule(
      id,
      body,
      currentUser,
    );
  }

  @Post(':id/complete')
  @Version('1')
  async complete(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: CurrentUserPayload,
  ) {
    return this.appointmentsService.complete(
      id,
      currentUser,
    );
  }
}
