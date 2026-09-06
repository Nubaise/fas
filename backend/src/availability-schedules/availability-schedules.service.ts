import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppointmentEntity } from '../appointments/entities/appointment.entity.js';
import { AppointmentStatus } from '../appointments/entities/appointment.entity.js';
import { AvailabilityExceptionEntity } from '../availability-exceptions/entities/availability-exception.entity.js';
import { FacultyService } from '../faculty/faculty.service.js';
import type {
  CreateAvailabilityScheduleDto,
  UpdateAvailabilityScheduleDto,
} from './dto/availability-schedule.dto.js';
import { AvailabilityScheduleEntity } from './entities/availability-schedule.entity.js';

type CurrentUser = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

@Injectable()
export class AvailabilitySchedulesService {
  constructor(
    @InjectRepository(AvailabilityScheduleEntity)
    private readonly schedulesRepository: Repository<AvailabilityScheduleEntity>,

    @InjectRepository(AvailabilityExceptionEntity)
    private readonly exceptionsRepository: Repository<AvailabilityExceptionEntity>,

    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepository: Repository<AppointmentEntity>,

    private readonly facultyService: FacultyService,
  ) {}

  async findAllForFaculty(
    facultyId: string,
  ): Promise<AvailabilityScheduleEntity[]> {
    await this.facultyService.findById(facultyId);

    return this.schedulesRepository.find({
      where: { facultyId },
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async findById(
    id: string,
  ): Promise<AvailabilityScheduleEntity> {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(
        'Availability schedule not found',
      );
    }

    return schedule;
  }

  async create(
    data: CreateAvailabilityScheduleDto,
    currentUser: CurrentUser,
  ): Promise<AvailabilityScheduleEntity> {
    await this.assertCanManageFaculty(
      data.facultyId,
      currentUser,
    );

    await this.facultyService.findById(data.facultyId);

    await this.ensureNoOverlap(
      data.facultyId,
      data.dayOfWeek,
      data.startTime,
      data.endTime,
    );

    const schedule = this.schedulesRepository.create({
      facultyId: data.facultyId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      isActive: data.isActive ?? true,
    });

    try {
      return await this.schedulesRepository.save(schedule);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Availability schedule already exists',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateAvailabilityScheduleDto,
    currentUser: CurrentUser,
  ): Promise<AvailabilityScheduleEntity> {
    const schedule = await this.findById(id);

    await this.assertCanManageFaculty(
      schedule.facultyId,
      currentUser,
    );

    const dayOfWeek =
      data.dayOfWeek ?? schedule.dayOfWeek;

    const startTime =
      data.startTime ?? schedule.startTime;

    const endTime =
      data.endTime ?? schedule.endTime;

    if (
      data.dayOfWeek !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined
    ) {
      await this.ensureNoOverlap(
        schedule.facultyId,
        dayOfWeek,
        startTime,
        endTime,
        schedule.id,
      );
    }

    Object.assign(schedule, data);

    try {
      return await this.schedulesRepository.save(schedule);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Availability schedule already exists',
        );
      }

      throw error;
    }
  }

  async remove(
    id: string,
    currentUser: CurrentUser,
  ): Promise<void> {
    const schedule = await this.findById(id);

    await this.assertCanManageFaculty(
      schedule.facultyId,
      currentUser,
    );

    await this.schedulesRepository.remove(schedule);
  }

  async getAvailableSlots(
    facultyId: string,
    date: string,
    excludeAppointmentId?: string,
  ): Promise<
    Array<{
      date: string;
      startTime: string;
      endTime: string;
    }>
  > {
    await this.facultyService.findById(facultyId);

    const dayOfWeek = new Date(
      `${date}T00:00:00Z`,
    ).getUTCDay();

    const schedules = await this.schedulesRepository.find({
      where: {
        facultyId,
        dayOfWeek,
        isActive: true,
      },
      order: {
        startTime: 'ASC',
      },
    });

    if (schedules.length === 0) {
      return [];
    }

    const exceptions = await this.exceptionsRepository.find({
      where: {
        facultyId,
        date,
      },
      order: {
        startTime: 'ASC',
      },
    });

    const appointments = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.faculty_id = :facultyId', {
        facultyId,
      })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
        ],
      })
      .andWhere(
        'appointment.start_time < :dayEnd',
      )
      .andWhere(
        'appointment.end_time > :dayStart',
      )
      .andWhere(
        excludeAppointmentId
          ? 'appointment.id != :excludeAppointmentId'
          : '1 = 1',
      )
      .setParameters({
        dayStart: `${date}T00:00:00.000Z`,
        dayEnd: `${date}T23:59:59.999Z`,
        ...(excludeAppointmentId
          ? { excludeAppointmentId }
          : {}),
      })
      .getMany();

    const bookedIntervals = appointments.map(
      (appointment) => ({
        startTime: this.extractUtcTime(
          appointment.startTime,
        ),
        endTime: this.extractUtcTime(
          appointment.endTime,
        ),
      }),
    );

    const slots: Array<{
      date: string;
      startTime: string;
      endTime: string;
    }> = [];

    for (const schedule of schedules) {
      const intervals = this.subtractExceptions(
        schedule.startTime,
        schedule.endTime,
        exceptions,
      );

      const scheduleSlots = this.generateSlots(
        date,
        schedule.startTime,
        schedule.endTime,
        schedule.slotDuration,
      );

      const availableSlots = scheduleSlots.filter(
        (slot) => {
          const isInsideAvailability =
            intervals.some(
              (interval) =>
                slot.startTime >= interval.startTime &&
                slot.endTime <= interval.endTime,
            );

          if (!isInsideAvailability) {
            return false;
          }

          const overlapsAppointment =
            bookedIntervals.some(
              (appointment) =>
                slot.startTime <
                  appointment.endTime &&
                slot.endTime >
                  appointment.startTime,
            );

          return !overlapsAppointment;
        },
      );

      slots.push(...availableSlots);
    }

    return slots;
  }

  private async ensureNoOverlap(
    facultyId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const schedules = await this.schedulesRepository.find({
      where: {
        facultyId,
        dayOfWeek,
      },
    });

    const overlapping = schedules.some((schedule) => {
      if (schedule.id === excludeId) {
        return false;
      }

      return (
        startTime < schedule.endTime &&
        endTime > schedule.startTime
      );
    });

    if (overlapping) {
      throw new ConflictException(
        'Availability schedule overlaps an existing schedule',
      );
    }
  }

  private subtractExceptions(
    scheduleStart: string,
    scheduleEnd: string,
    exceptions: AvailabilityExceptionEntity[],
  ): Array<{
    startTime: string;
    endTime: string;
  }> {
    const relevantExceptions = exceptions
      .filter(
        (exception) =>
          exception.startTime !== null &&
          exception.endTime !== null,
      )
      .map((exception) => ({
        startTime: exception.startTime as string,
        endTime: exception.endTime as string,
      }))
      .filter(
        (exception) =>
          exception.startTime < scheduleEnd &&
          exception.endTime > scheduleStart,
      )
      .sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

    const wholeDayException = exceptions.some(
      (exception) =>
        exception.startTime === null &&
        exception.endTime === null,
    );

    if (wholeDayException) {
      return [];
    }

    const intervals: Array<{
      startTime: string;
      endTime: string;
    }> = [];

    let currentStart = scheduleStart;

    for (const exception of relevantExceptions) {
      if (exception.startTime > currentStart) {
        intervals.push({
          startTime: currentStart,
          endTime:
            exception.startTime < scheduleEnd
              ? exception.startTime
              : scheduleEnd,
        });
      }

      if (exception.endTime > currentStart) {
        currentStart = exception.endTime;
      }

      if (currentStart >= scheduleEnd) {
        break;
      }
    }

    if (currentStart < scheduleEnd) {
      intervals.push({
        startTime: currentStart,
        endTime: scheduleEnd,
      });
    }

    return intervals;
  }

  private generateSlots(
    date: string,
    startTime: string,
    endTime: string,
    slotDuration: number,
  ): Array<{
    date: string;
    startTime: string;
    endTime: string;
  }> {
    const slots: Array<{
      date: string;
      startTime: string;
      endTime: string;
    }> = [];

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    let currentMinutes = startMinutes;

    while (
      currentMinutes + slotDuration <= endMinutes
    ) {
      const slotStart = this.minutesToTime(
        currentMinutes,
      );

      const slotEnd = this.minutesToTime(
        currentMinutes + slotDuration,
      );

      slots.push({
        date,
        startTime: slotStart,
        endTime: slotEnd,
      });

      currentMinutes += slotDuration;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time
      .split(':')
      .map(Number);

    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours
      .toString()
      .padStart(2, '0')}:${remainingMinutes
      .toString()
      .padStart(2, '0')}`;
  }

  private extractUtcTime(date: Date): string {
    const hours = date
      .getUTCHours()
      .toString()
      .padStart(2, '0');

    const minutes = date
      .getUTCMinutes()
      .toString()
      .padStart(2, '0');

    return `${hours}:${minutes}`;
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
