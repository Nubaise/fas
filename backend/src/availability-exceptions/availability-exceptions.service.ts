import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FacultyService } from '../faculty/faculty.service.js';
import type {
  CreateAvailabilityExceptionDto,
  UpdateAvailabilityExceptionDto,
} from './dto/availability-exception.dto.js';
import { AvailabilityExceptionEntity } from './entities/availability-exception.entity.js';

type CurrentUser = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

@Injectable()
export class AvailabilityExceptionsService {
  constructor(
    @InjectRepository(AvailabilityExceptionEntity)
    private readonly exceptionsRepository: Repository<AvailabilityExceptionEntity>,
    private readonly facultyService: FacultyService,
  ) {}

  async findAllForFaculty(
    facultyId: string,
  ): Promise<AvailabilityExceptionEntity[]> {
    await this.facultyService.findById(facultyId);

    return this.exceptionsRepository.find({
      where: { facultyId },
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async findById(
    id: string,
  ): Promise<AvailabilityExceptionEntity> {
    const exception = await this.exceptionsRepository.findOne({
      where: { id },
    });

    if (!exception) {
      throw new NotFoundException(
        'Availability exception not found',
      );
    }

    return exception;
  }

  async create(
    data: CreateAvailabilityExceptionDto,
    currentUser: CurrentUser,
  ): Promise<AvailabilityExceptionEntity> {
    await this.assertCanManageFaculty(
      data.facultyId,
      currentUser,
    );

    await this.facultyService.findById(data.facultyId);

    const exception = this.exceptionsRepository.create({
      facultyId: data.facultyId,
      date: data.date,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      reason: data.reason ?? null,
    });

    try {
      return await this.exceptionsRepository.save(exception);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Availability exception already exists',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateAvailabilityExceptionDto,
    currentUser: CurrentUser,
  ): Promise<AvailabilityExceptionEntity> {
    const exception = await this.findById(id);

    await this.assertCanManageFaculty(
      exception.facultyId,
      currentUser,
    );

    const date = data.date ?? exception.date;
    const startTime =
      data.startTime !== undefined
        ? data.startTime
        : exception.startTime;
    const endTime =
      data.endTime !== undefined
        ? data.endTime
        : exception.endTime;

    if (
      (startTime === null && endTime !== null) ||
      (startTime !== null && endTime === null)
    ) {
      throw new ConflictException(
        'Partial availability exception requires both start and end times',
      );
    }

    if (
      startTime !== null &&
      endTime !== null &&
      startTime >= endTime
    ) {
      throw new ConflictException(
        'Exception start time must be earlier than end time',
      );
    }

    Object.assign(exception, {
      ...data,
      date,
      startTime,
      endTime,
    });

    try {
      return await this.exceptionsRepository.save(exception);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Availability exception already exists',
        );
      }

      throw error;
    }
  }

  async remove(
    id: string,
    currentUser: CurrentUser,
  ): Promise<void> {
    const exception = await this.findById(id);

    await this.assertCanManageFaculty(
      exception.facultyId,
      currentUser,
    );

    await this.exceptionsRepository.remove(exception);
  }

  private async assertCanManageFaculty(
    facultyId: string,
    currentUser: CurrentUser,
  ): Promise<void> {
    if (currentUser.role === 'ADMIN') {
      return;
    }

    if (currentUser.role !== 'FACULTY') {
      throw new ForbiddenException(
        'Only faculty members or administrators can manage availability',
      );
    }

    const faculty = await this.facultyService.findById(
      facultyId,
    );

    if (faculty.userId !== currentUser.id) {
      throw new ForbiddenException(
        'You can only manage your own availability',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
