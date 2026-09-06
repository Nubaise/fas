import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AvailabilitySchedulesService } from '../availability-schedules/availability-schedules.service.js';
import { FacultyEntity } from '../faculty/entities/faculty.entity.js';
import { FacultyService } from '../faculty/faculty.service.js';
import {
  NotificationJobEntity,
  NotificationJobStatus,
} from '../notification-jobs/entities/notification-job.entity.js';
import { StudentEntity } from '../students/entities/student.entity.js';
import type { CreateAppointmentDto } from './dto/appointment.dto.js';
import {
  AppointmentEntity,
  AppointmentStatus,
} from './entities/appointment.entity.js';

type CurrentUser = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepository: Repository<AppointmentEntity>,

    @InjectRepository(StudentEntity)
    private readonly studentsRepository: Repository<StudentEntity>,

    @InjectRepository(FacultyEntity)
    private readonly facultyRepository: Repository<FacultyEntity>,

    @InjectRepository(NotificationJobEntity)
    private readonly notificationJobsRepository: Repository<NotificationJobEntity>,

    private readonly facultyService: FacultyService,

    private readonly availabilitySchedulesService: AvailabilitySchedulesService,

    private readonly dataSource: DataSource,
  ) {}

  async create(
    data: CreateAppointmentDto,
    currentUser: CurrentUser,
  ): Promise<AppointmentEntity> {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException(
        'Only students can create appointments',
      );
    }

    const student = await this.studentsRepository.findOne({
      where: {
        userId: currentUser.id,
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student profile not found',
      );
    }

    const faculty = await this.facultyService.findById(
      data.facultyId,
    );

    const requestedStart = new Date(data.startTime);
    const requestedEnd = new Date(data.endTime);

    const date = data.startTime.slice(0, 10);

    const availableSlots =
      await this.availabilitySchedulesService.getAvailableSlots(
        data.facultyId,
        date,
      );

    const requestedStartTime = this.extractTime(
      data.startTime,
    );
    const requestedEndTime = this.extractTime(
      data.endTime,
    );

    const isGeneratedSlot = availableSlots.some(
      (slot) =>
        slot.startTime === requestedStartTime &&
        slot.endTime === requestedEndTime,
    );

    if (!isGeneratedSlot) {
      throw new ConflictException(
        'Requested time is not an available appointment slot',
      );
    }

    try {
      return await this.dataSource.transaction(
        async (manager) => {
          const appointment = manager.create(
            AppointmentEntity,
            {
              studentId: student.id,
              facultyId: faculty.id,
              startTime: requestedStart,
              endTime: requestedEnd,
              reason: data.reason.trim(),
              status: AppointmentStatus.PENDING,
            },
          );

          const savedAppointment = await manager.save(
            AppointmentEntity,
            appointment,
          );

          const notificationJob = manager.create(
            NotificationJobEntity,
            {
              type: 'APPOINTMENT_REQUESTED',
              recipientId: faculty.userId,
              payload: {
                appointmentId: savedAppointment.id,
              },
              status: NotificationJobStatus.PENDING,
              attempts: 0,
              availableAt: new Date(),
              processedAt: null,
            },
          );

          await manager.save(
            NotificationJobEntity,
            notificationJob,
          );

          return savedAppointment;
        },
      );
    } catch (error) {
      if (this.isExclusionViolation(error)) {
        throw new ConflictException(
          'The appointment slot is no longer available',
        );
      }

      throw error;
    }
  }

  async findAll(
    currentUser: CurrentUser,
  ): Promise<AppointmentEntity[]> {
    if (currentUser.role === 'ADMIN') {
      return this.appointmentsRepository.find({
        order: {
          startTime: 'ASC',
          createdAt: 'ASC',
        },
      });
    }

    if (currentUser.role === 'STUDENT') {
      const student = await this.studentsRepository.findOne({
        where: {
          userId: currentUser.id,
        },
      });

      if (!student) {
        throw new NotFoundException(
          'Student profile not found',
        );
      }

      return this.appointmentsRepository.find({
        where: {
          studentId: student.id,
        },
        order: {
          startTime: 'ASC',
          createdAt: 'ASC',
        },
      });
    }

    const faculty = await this.facultyRepository.findOne({
      where: {
        userId: currentUser.id,
      },
    });

    if (!faculty) {
      throw new NotFoundException(
        'Faculty profile not found',
      );
    }

    return this.appointmentsRepository.find({
      where: {
        facultyId: faculty.id,
      },
      order: {
        startTime: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async findById(
    id: string,
    currentUser: CurrentUser,
  ): Promise<AppointmentEntity> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (currentUser.role === 'ADMIN') {
      return appointment;
    }

    if (currentUser.role === 'STUDENT') {
      const student = await this.studentsRepository.findOne({
        where: {
          userId: currentUser.id,
        },
      });

      if (!student) {
        throw new NotFoundException(
          'Student profile not found',
        );
      }

      if (appointment.studentId !== student.id) {
        throw new ForbiddenException(
          'You can only view your own appointments',
        );
      }

      return appointment;
    }

    const faculty = await this.facultyRepository.findOne({
      where: {
        userId: currentUser.id,
      },
    });

    if (!faculty) {
      throw new NotFoundException(
        'Faculty profile not found',
      );
    }

    if (appointment.facultyId !== faculty.id) {
      throw new ForbiddenException(
        'You can only view your own appointments',
      );
    }

    return appointment;
  }

  async accept(
    id: string,
    currentUser: CurrentUser,
  ): Promise<AppointmentEntity> {
    if (currentUser.role !== 'FACULTY') {
      throw new ForbiddenException(
        'Only faculty can accept appointments',
      );
    }

    const faculty = await this.facultyRepository.findOne({
      where: {
        userId: currentUser.id,
      },
    });

    if (!faculty) {
      throw new NotFoundException(
        'Faculty profile not found',
      );
    }

    return this.transitionStatus(
      id,
      faculty.id,
      AppointmentStatus.CONFIRMED,
      'APPOINTMENT_CONFIRMED',
    );
  }

  async reject(
    id: string,
    currentUser: CurrentUser,
  ): Promise<AppointmentEntity> {
    if (currentUser.role !== 'FACULTY') {
      throw new ForbiddenException(
        'Only faculty can reject appointments',
      );
    }

    const faculty = await this.facultyRepository.findOne({
      where: {
        userId: currentUser.id,
      },
    });

    if (!faculty) {
      throw new NotFoundException(
        'Faculty profile not found',
      );
    }

    return this.transitionStatus(
      id,
      faculty.id,
      AppointmentStatus.REJECTED,
      'APPOINTMENT_REJECTED',
    );
  }

  private async transitionStatus(
    id: string,
    facultyId: string,
    nextStatus: AppointmentStatus.CONFIRMED | AppointmentStatus.REJECTED,
    notificationType: string,
  ): Promise<AppointmentEntity> {
    return this.dataSource.transaction(
      async (manager) => {
        const appointment = await manager.findOne(
          AppointmentEntity,
          {
            where: { id },
            lock: {
              mode: 'pessimistic_write',
            },
          },
        );

        if (!appointment) {
          throw new NotFoundException('Appointment not found');
        }

        if (appointment.facultyId !== facultyId) {
          throw new ForbiddenException(
            'You can only manage your own appointments',
          );
        }

        if (appointment.status !== AppointmentStatus.PENDING) {
          throw new ConflictException(
            'Only pending appointments can be accepted or rejected',
          );
        }

        appointment.status = nextStatus;

        const savedAppointment = await manager.save(
          AppointmentEntity,
          appointment,
        );

        const student = await manager.findOne(
          StudentEntity,
          {
            where: {
              id: appointment.studentId,
            },
          },
        );

        if (!student) {
          throw new NotFoundException(
            'Student profile not found',
          );
        }

        const notificationJob = manager.create(
          NotificationJobEntity,
          {
            type: notificationType,
            recipientId: student.userId,
            payload: {
              appointmentId: savedAppointment.id,
            },
            status: NotificationJobStatus.PENDING,
            attempts: 0,
            availableAt: new Date(),
            processedAt: null,
          },
        );

        await manager.save(
          NotificationJobEntity,
          notificationJob,
        );

        return savedAppointment;
      },
    );
  }

  private extractTime(value: string): string {
    return value.slice(11, 16);
  }

  private isExclusionViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23P01'
    );
  }
}
