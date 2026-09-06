import { jest } from '@jest/globals';

import { AvailabilitySchedulesController } from './availability-schedules.controller.js';

describe('AvailabilitySchedulesController', () => {
  const availabilitySchedulesService = {
    findAllForFaculty: jest.fn(),
    getAvailableSlots: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const controller = new AvailabilitySchedulesController(
    availabilitySchedulesService as never,
  );

  const facultyId = 'faculty-1';
  const scheduleId = 'schedule-1';

  const currentUser = {
    id: 'user-1',
    role: 'FACULTY' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForFaculty', () => {
    it('returns schedules for a faculty member', async () => {
      const schedules = [
        {
          id: scheduleId,
          facultyId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          slotDuration: 30,
          isActive: true,
        },
      ];

      availabilitySchedulesService.findAllForFaculty.mockResolvedValue(
        schedules,
      );

      const result = await controller.findAllForFaculty(
        facultyId,
      );

      expect(result).toBe(schedules);
      expect(
        availabilitySchedulesService.findAllForFaculty,
      ).toHaveBeenCalledWith(facultyId);
    });
  });

  describe('getAvailableSlots', () => {
    it('returns generated availability slots for a faculty member and date', async () => {
      const date = '2026-09-14';
      const slots = [
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
      ];

      availabilitySchedulesService.getAvailableSlots.mockResolvedValue(
        slots,
      );

      const result = await controller.getAvailableSlots(
        facultyId,
        date,
      );

      expect(result).toBe(slots);
      expect(
        availabilitySchedulesService.getAvailableSlots,
      ).toHaveBeenCalledWith(facultyId, date);
    });
  });

  describe('findById', () => {
    it('returns a schedule by ID', async () => {
      const schedule = {
        id: scheduleId,
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30,
        isActive: true,
      };

      availabilitySchedulesService.findById.mockResolvedValue(
        schedule,
      );

      const result = await controller.findById(scheduleId);

      expect(result).toBe(schedule);
      expect(
        availabilitySchedulesService.findById,
      ).toHaveBeenCalledWith(scheduleId);
    });
  });

  describe('create', () => {
    it('passes the request body and current user to the service', async () => {
      const body = {
        facultyId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 30 as const,
        isActive: true,
      };

      const schedule = {
        id: scheduleId,
        ...body,
      };

      availabilitySchedulesService.create.mockResolvedValue(
        schedule,
      );

      const result = await controller.create(
        body,
        currentUser,
      );

      expect(result).toBe(schedule);
      expect(
        availabilitySchedulesService.create,
      ).toHaveBeenCalledWith(body, currentUser);
    });
  });

  describe('update', () => {
    it('passes the schedule ID, request body, and current user to the service', async () => {
      const body = {
        startTime: '10:00',
        endTime: '13:00',
      };

      const schedule = {
        id: scheduleId,
        facultyId,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '13:00',
        slotDuration: 30,
        isActive: true,
      };

      availabilitySchedulesService.update.mockResolvedValue(
        schedule,
      );

      const result = await controller.update(
        scheduleId,
        body,
        currentUser,
      );

      expect(result).toBe(schedule);
      expect(
        availabilitySchedulesService.update,
      ).toHaveBeenCalledWith(
        scheduleId,
        body,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('passes the schedule ID and current user to the service', async () => {
      await controller.remove(scheduleId, currentUser);

      expect(
        availabilitySchedulesService.remove,
      ).toHaveBeenCalledWith(scheduleId, currentUser);
    });
  });
});
