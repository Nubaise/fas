import { jest } from '@jest/globals';

import {
  AppointmentEntity,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity.js';
import { AvailabilityExceptionEntity } from '../availability-exceptions/entities/availability-exception.entity.js';
import { AvailabilitySchedulesService } from './availability-schedules.service.js';
import { AvailabilityScheduleEntity } from './entities/availability-schedule.entity.js';

describe('AvailabilitySchedulesService', () => {
  let service: AvailabilitySchedulesService;

  const schedulesRepository = {
    find: jest.fn(
      async (): Promise<AvailabilityScheduleEntity[]> => [],
    ),
    findOne: jest.fn(
      async (): Promise<AvailabilityScheduleEntity | null> => null,
    ),
    create: jest.fn(
      (data: Partial<AvailabilityScheduleEntity>) =>
        data as AvailabilityScheduleEntity,
    ),
    save: jest.fn(
      async (
        schedule: AvailabilityScheduleEntity,
      ): Promise<AvailabilityScheduleEntity> => schedule,
    ),
    remove: jest.fn(
      async (
        schedule: AvailabilityScheduleEntity,
      ): Promise<AvailabilityScheduleEntity> => schedule,
    ),
  };

  const exceptionsRepository = {
    find: jest.fn(
      async (): Promise<AvailabilityExceptionEntity[]> => [],
    ),
  };

  const appointmentsRepository = {
    createQueryBuilder: jest.fn<() => any>(),
  };

  const facultyService = {
    findById: jest.fn(
      async (): Promise<{ id: string; userId?: string }> => ({
        id: '',
      }),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    schedulesRepository.find.mockResolvedValue([]);
    schedulesRepository.findOne.mockResolvedValue(null);
    schedulesRepository.create.mockImplementation(
      (data: Partial<AvailabilityScheduleEntity>) =>
        data as AvailabilityScheduleEntity,
    );
    schedulesRepository.save.mockImplementation(
      async (
        schedule: AvailabilityScheduleEntity,
      ): Promise<AvailabilityScheduleEntity> => schedule,
    );
    schedulesRepository.remove.mockImplementation(
      async (
        schedule: AvailabilityScheduleEntity,
      ): Promise<AvailabilityScheduleEntity> => schedule,
    );

    exceptionsRepository.find.mockResolvedValue([]);

    appointmentsRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getMany: jest.fn(
        async (): Promise<AppointmentEntity[]> => [],
      ),
    });

    facultyService.findById.mockResolvedValue({
      id: '',
    });

    service = new AvailabilitySchedulesService(
      schedulesRepository as never,
      exceptionsRepository as never,
      appointmentsRepository as never,
      facultyService as never,
    );
  });

  describe('getAvailableSlots', () => {
    it('should generate slots from a normal availability schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
        {
          date,
          startTime: '11:00',
          endTime: '11:30',
        },
        {
          date,
          startTime: '11:30',
          endTime: '12:00',
        },
      ]);
    });

    it('should keep slots aligned to the original schedule when an exception has non-aligned boundaries', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exception = {
        facultyId,
        date,
        startTime: '10:15',
        endTime: '10:45',
        reason: 'Meeting',
      } as AvailabilityExceptionEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([
        exception,
      ]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '11:00',
          endTime: '11:30',
        },
        {
          date,
          startTime: '11:30',
          endTime: '12:00',
        },
      ]);
    });

    it('should remove slots covered by a partial-day exception', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exception = {
        facultyId,
        date,
        startTime: '10:00',
        endTime: '11:00',
        reason: 'Department meeting',
      } as AvailabilityExceptionEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([
        exception,
      ]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '11:00',
          endTime: '11:30',
        },
        {
          date,
          startTime: '11:30',
          endTime: '12:00',
        },
      ]);
    });

    it('should return no slots for a whole-day exception', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exception = {
        facultyId,
        date,
        startTime: null,
        endTime: null,
        reason: 'Leave',
      } as AvailabilityExceptionEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([
        exception,
      ]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([]);
    });

    it('should handle multiple non-overlapping exceptions', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '14:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exceptions = [
        {
          facultyId,
          date,
          startTime: '10:00',
          endTime: '11:00',
          reason: 'Meeting',
        },
        {
          facultyId,
          date,
          startTime: '12:00',
          endTime: '13:00',
          reason: 'Meeting',
        },
      ] as AvailabilityExceptionEntity[];

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue(
        exceptions,
      );

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '11:00',
          endTime: '11:30',
        },
        {
          date,
          startTime: '11:30',
          endTime: '12:00',
        },
        {
          date,
          startTime: '13:00',
          endTime: '13:30',
        },
        {
          date,
          startTime: '13:30',
          endTime: '14:00',
        },
      ]);
    });

    it('should merge overlapping exceptions logically', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '14:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exceptions = [
        {
          facultyId,
          date,
          startTime: '10:00',
          endTime: '11:30',
          reason: 'Meeting',
        },
        {
          facultyId,
          date,
          startTime: '11:00',
          endTime: '13:00',
          reason: 'Department event',
        },
      ] as AvailabilityExceptionEntity[];

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue(
        exceptions,
      );

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '13:00',
          endTime: '13:30',
        },
        {
          date,
          startTime: '13:30',
          endTime: '14:00',
        },
      ]);
    });

    it('should ignore an exception outside the availability schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exception = {
        facultyId,
        date,
        startTime: '14:00',
        endTime: '15:00',
        reason: 'Meeting',
      } as AvailabilityExceptionEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([
        exception,
      ]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
        {
          date,
          startTime: '11:00',
          endTime: '11:30',
        },
        {
          date,
          startTime: '11:30',
          endTime: '12:00',
        },
      ]);
    });

    it('should handle an exception that overlaps the beginning of the schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exception = {
        facultyId,
        date,
        startTime: '08:00',
        endTime: '10:00',
        reason: 'Meeting',
      } as AvailabilityExceptionEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([
        exception,
      ]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
        {
          date,
          startTime: '11:00',
          endTime: '11:30',
        },
        {
          date,
          startTime: '11:30',
          endTime: '12:00',
        },
      ]);
    });

    it('should handle an exception that overlaps the end of the schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const exception = {
        facultyId,
        date,
        startTime: '11:00',
        endTime: '13:00',
        reason: 'Meeting',
      } as AvailabilityExceptionEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([
        exception,
      ]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
      ]);
    });

    it('should discard leftover time when the schedule is not divisible by the slot duration', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:10',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([
        schedule,
      ]);

      exceptionsRepository.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
      ]);
    });


    it('should remove a slot blocked by a PENDING appointment', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const appointment = {
        facultyId,
        startTime: new Date('2026-09-07T09:30:00.000Z'),
        endTime: new Date('2026-09-07T10:00:00.000Z'),
        status: AppointmentStatus.PENDING,
      } as AppointmentEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([schedule]);
      exceptionsRepository.find.mockResolvedValue([]);

      appointmentsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn(
          async (): Promise<AppointmentEntity[]> => [appointment],
        ),
      });

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
      ]);
    });

    it('should remove a slot blocked by a CONFIRMED appointment', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const appointment = {
        facultyId,
        startTime: new Date('2026-09-07T10:00:00.000Z'),
        endTime: new Date('2026-09-07T10:30:00.000Z'),
        status: AppointmentStatus.CONFIRMED,
      } as AppointmentEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([schedule]);
      exceptionsRepository.find.mockResolvedValue([]);

      appointmentsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn(
          async (): Promise<AppointmentEntity[]> => [appointment],
        ),
      });

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
      ]);
    });

    it('should not remove slots for REJECTED or CANCELLED appointments', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const rejectedAppointment = {
        facultyId,
        startTime: new Date('2026-09-07T09:30:00.000Z'),
        endTime: new Date('2026-09-07T10:00:00.000Z'),
        status: AppointmentStatus.REJECTED,
      } as AppointmentEntity;

      const cancelledAppointment = {
        facultyId,
        startTime: new Date('2026-09-07T10:00:00.000Z'),
        endTime: new Date('2026-09-07T10:30:00.000Z'),
        status: AppointmentStatus.CANCELLED,
      } as AppointmentEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([schedule]);
      exceptionsRepository.find.mockResolvedValue([]);

      // Simulate the database status condition used by the service:
      // only PENDING and CONFIRMED appointments are returned.
      appointmentsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn(
          async (): Promise<AppointmentEntity[]> => [],
        ),
      });

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
      ]);

      expect(rejectedAppointment.status).toBe(
        AppointmentStatus.REJECTED,
      );
      expect(cancelledAppointment.status).toBe(
        AppointmentStatus.CANCELLED,
      );
    });

    it('should not remove a slot for a non-overlapping appointment', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const appointment = {
        facultyId,
        startTime: new Date('2026-09-07T11:00:00.000Z'),
        endTime: new Date('2026-09-07T11:30:00.000Z'),
        status: AppointmentStatus.CONFIRMED,
      } as AppointmentEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([schedule]);
      exceptionsRepository.find.mockResolvedValue([]);

      appointmentsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn(
          async (): Promise<AppointmentEntity[]> => [appointment],
        ),
      });

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([
        {
          date,
          startTime: '09:00',
          endTime: '09:30',
        },
        {
          date,
          startTime: '09:30',
          endTime: '10:00',
        },
        {
          date,
          startTime: '10:00',
          endTime: '10:30',
        },
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
      ]);
    });

    it('should remove every slot overlapped by an active appointment', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      const schedule = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const appointment = {
        facultyId,
        startTime: new Date('2026-09-07T09:15:00.000Z'),
        endTime: new Date('2026-09-07T10:15:00.000Z'),
        status: AppointmentStatus.CONFIRMED,
      } as AppointmentEntity;

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([schedule]);
      exceptionsRepository.find.mockResolvedValue([]);

      appointmentsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn(
          async (): Promise<AppointmentEntity[]> => [appointment],
        ),
      });

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      // The appointment overlaps 09:00-09:30, 09:30-10:00,
      // and 10:00-10:30, so all three are unavailable.
      expect(result).toEqual([
        {
          date,
          startTime: '10:30',
          endTime: '11:00',
        },
      ]);
    });

    it('should ignore inactive availability schedules', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-07'; // Monday

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([]);

      exceptionsRepository.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([]);

      expect(schedulesRepository.find).toHaveBeenCalledWith({
        where: {
          facultyId,
          dayOfWeek: 1,
          isActive: true,
        },
        order: {
          startTime: 'ASC',
        },
      });
    });

    it('should return no slots when the faculty has no schedule for the requested day', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const date = '2026-09-08'; // Tuesday

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([]);

      exceptionsRepository.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toEqual([]);

      expect(exceptionsRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findAllForFaculty', () => {
    it('should return all schedules for an existing faculty member', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const schedules = [
        {
          id: '33333333-3333-3333-3333-333333333333',
          facultyId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          slotDuration: 30 as const,
          isActive: true,
        },
      ] as AvailabilityScheduleEntity[];

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue(
        schedules,
      );

      const result =
        await service.findAllForFaculty(facultyId);

      expect(result).toEqual(schedules);

      expect(facultyService.findById).toHaveBeenCalledWith(
        facultyId,
      );

      expect(schedulesRepository.find).toHaveBeenCalledWith({
        where: { facultyId },
        order: {
          dayOfWeek: 'ASC',
          startTime: 'ASC',
        },
      });
    });
  });

  describe('findById', () => {
    it('should return an existing availability schedule', async () => {
      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId:
          '11111111-1111-1111-1111-111111111111',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      schedulesRepository.findOne.mockResolvedValue(
        schedule,
      );

      const result = await service.findById(schedule.id);

      expect(result).toEqual(schedule);

      expect(
        schedulesRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: schedule.id },
      });
    });

    it('should throw when the availability schedule does not exist', async () => {
      schedulesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findById(
          '33333333-3333-3333-3333-333333333333',
        ),
      ).rejects.toThrow(
        'Availability schedule not found',
      );
    });
  });

  describe('create', () => {
    it('should create a valid availability schedule for a faculty member', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const userId =
        '22222222-2222-2222-2222-222222222222';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const data = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      };

      const currentUser = {
        id: userId,
        role: 'FACULTY' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId,
      });

      schedulesRepository.find.mockResolvedValue([]);

      schedulesRepository.create.mockReturnValue(
        schedule,
      );

      schedulesRepository.save.mockResolvedValue(
        schedule,
      );

      const result = await service.create(
        data,
        currentUser,
      );

      expect(result).toEqual(schedule);

      expect(
        schedulesRepository.create,
      ).toHaveBeenCalledWith({
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      });

      expect(
        schedulesRepository.save,
      ).toHaveBeenCalledWith(schedule);
    });

    it('should reject an overlapping availability schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const userId =
        '22222222-2222-2222-2222-222222222222';

      const existingSchedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '13:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: userId,
        role: 'FACULTY' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId,
      });

      schedulesRepository.find.mockResolvedValue([
        existingSchedule,
      ]);

      await expect(
        service.create(
          {
            facultyId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '11:00',
            slotDuration: 30 as const,
            isActive: true,
          },
          currentUser,
        ),
      ).rejects.toThrow(
        'Availability schedule overlaps an existing schedule',
      );

      expect(
        schedulesRepository.create,
      ).not.toHaveBeenCalled();

      expect(
        schedulesRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('should allow adjacent non-overlapping schedules', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const userId =
        '22222222-2222-2222-2222-222222222222';

      const existingSchedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const newSchedule = {
        id: '44444444-4444-4444-4444-444444444444',
        facultyId,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: userId,
        role: 'FACULTY' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId,
      });

      schedulesRepository.find.mockResolvedValue([
        existingSchedule,
      ]);

      schedulesRepository.create.mockReturnValue(
        newSchedule,
      );

      schedulesRepository.save.mockResolvedValue(
        newSchedule,
      );

      const result = await service.create(
        {
          facultyId,
          dayOfWeek: 1,
          startTime: '10:00',
          endTime: '11:00',
          slotDuration: 30 as const,
          isActive: true,
        },
        currentUser,
      );

      expect(result).toEqual(newSchedule);

      expect(
        schedulesRepository.save,
      ).toHaveBeenCalledWith(newSchedule);
    });

    it('should reject schedule management by a student', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const currentUser = {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'STUDENT' as const,
      };

      await expect(
        service.create(
          {
            facultyId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            slotDuration: 30 as const,
            isActive: true,
          },
          currentUser,
        ),
      ).rejects.toThrow(
        'Only faculty members or administrators can manage availability',
      );

      expect(
        facultyService.findById,
      ).not.toHaveBeenCalled();

      expect(
        schedulesRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('should reject a faculty member from managing another faculty member availability', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const currentUser = {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'FACULTY' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId: 'different-user-id',
      });

      await expect(
        service.create(
          {
            facultyId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            slotDuration: 30 as const,
            isActive: true,
          },
          currentUser,
        ),
      ).rejects.toThrow(
        'You can only manage your own availability',
      );

      expect(
        schedulesRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('should allow an administrator to manage faculty availability', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'ADMIN' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
      });

      schedulesRepository.find.mockResolvedValue([]);

      schedulesRepository.create.mockReturnValue(
        schedule,
      );

      schedulesRepository.save.mockResolvedValue(
        schedule,
      );

      const result = await service.create(
        {
          facultyId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          slotDuration: 30 as const,
          isActive: true,
        },
        currentUser,
      );

      expect(result).toEqual(schedule);

      expect(
        schedulesRepository.save,
      ).toHaveBeenCalledWith(schedule);
    });
  });

  describe('update', () => {
    it('should update an existing availability schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const userId =
        '22222222-2222-2222-2222-222222222222';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const updatedSchedule = {
        ...schedule,
        startTime: '10:00',
        endTime: '13:00',
        slotDuration: 60,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: userId,
        role: 'FACULTY' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId,
      });

      schedulesRepository.findOne.mockResolvedValue(
        schedule,
      );

      schedulesRepository.find.mockResolvedValue([]);

      schedulesRepository.save.mockResolvedValue(
        updatedSchedule,
      );

      const result = await service.update(
        schedule.id,
        {
          startTime: '10:00',
          endTime: '13:00',
          slotDuration: 60,
        },
        currentUser,
      );

      expect(result).toEqual(updatedSchedule);

      expect(
        schedulesRepository.save,
      ).toHaveBeenCalledWith(schedule);

      expect(schedule.startTime).toBe('10:00');
      expect(schedule.endTime).toBe('13:00');
      expect(schedule.slotDuration).toBe(60);
    });

    it('should reject an update that creates an overlapping schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const userId =
        '22222222-2222-2222-2222-222222222222';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const otherSchedule = {
        id: '44444444-4444-4444-4444-444444444444',
        facultyId,
        dayOfWeek: 1,
        startTime: '11:00',
        endTime: '13:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: userId,
        role: 'FACULTY' as const,
      };

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId,
      });

      schedulesRepository.findOne.mockResolvedValue(
        schedule,
      );

      schedulesRepository.find.mockResolvedValue([
        otherSchedule,
      ]);

      await expect(
        service.update(
          schedule.id,
          {
            startTime: '10:30',
            endTime: '12:00',
          },
          currentUser,
        ),
      ).rejects.toThrow(
        'Availability schedule overlaps an existing schedule',
      );

      expect(
        schedulesRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('should reject an update by a different faculty member', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'FACULTY' as const,
      };

      schedulesRepository.findOne.mockResolvedValue(
        schedule,
      );

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId: 'different-user-id',
      });

      await expect(
        service.update(
          schedule.id,
          {
            startTime: '10:00',
          },
          currentUser,
        ),
      ).rejects.toThrow(
        'You can only manage your own availability',
      );

      expect(
        schedulesRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an existing availability schedule', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const userId =
        '22222222-2222-2222-222222222222';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: userId,
        role: 'FACULTY' as const,
      };

      schedulesRepository.findOne.mockResolvedValue(
        schedule,
      );

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId,
      });

      await service.remove(
        schedule.id,
        currentUser,
      );

      expect(
        schedulesRepository.remove,
      ).toHaveBeenCalledWith(schedule);
    });

    it('should reject removal by a different faculty member', async () => {
      const facultyId =
        '11111111-1111-1111-1111-111111111111';

      const schedule = {
        id: '33333333-3333-3333-3333-333333333333',
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      } as AvailabilityScheduleEntity;

      const currentUser = {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'FACULTY' as const,
      };

      schedulesRepository.findOne.mockResolvedValue(
        schedule,
      );

      facultyService.findById.mockResolvedValue({
        id: facultyId,
        userId: 'different-user-id',
      });

      await expect(
        service.remove(
          schedule.id,
          currentUser,
        ),
      ).rejects.toThrow(
        'You can only manage your own availability',
      );

      expect(
        schedulesRepository.remove,
      ).not.toHaveBeenCalled();
    });
  });
});
