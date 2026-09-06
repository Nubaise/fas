import { jest } from '@jest/globals';

import { AvailabilityExceptionsController } from './availability-exceptions.controller.js';

describe('AvailabilityExceptionsController', () => {
  const availabilityExceptionsService = {
    findAllForFaculty: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const controller = new AvailabilityExceptionsController(
    availabilityExceptionsService as never,
  );

  const facultyId = 'faculty-1';
  const exceptionId = 'exception-1';

  const currentUser = {
    id: 'user-1',
    role: 'FACULTY' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForFaculty', () => {
    it('returns exceptions for a faculty member', async () => {
      const exceptions = [
        {
          id: exceptionId,
          facultyId,
          date: '2026-09-14',
          startTime: null,
          endTime: null,
          reason: 'Leave',
        },
      ];

      availabilityExceptionsService.findAllForFaculty.mockResolvedValue(
        exceptions,
      );

      const result = await controller.findAllForFaculty(
        facultyId,
      );

      expect(result).toBe(exceptions);
      expect(
        availabilityExceptionsService.findAllForFaculty,
      ).toHaveBeenCalledWith(facultyId);
    });
  });

  describe('findById', () => {
    it('returns an exception by ID', async () => {
      const exception = {
        id: exceptionId,
        facultyId,
        date: '2026-09-14',
        startTime: null,
        endTime: null,
        reason: 'Leave',
      };

      availabilityExceptionsService.findById.mockResolvedValue(
        exception,
      );

      const result = await controller.findById(exceptionId);

      expect(result).toBe(exception);
      expect(
        availabilityExceptionsService.findById,
      ).toHaveBeenCalledWith(exceptionId);
    });
  });

  describe('create', () => {
    it('passes the request body and current user to the service', async () => {
      const body = {
        facultyId,
        date: '2026-09-14',
        startTime: '10:00',
        endTime: '11:00',
        reason: 'Meeting',
      };

      const exception = {
        id: exceptionId,
        ...body,
      };

      availabilityExceptionsService.create.mockResolvedValue(
        exception,
      );

      const result = await controller.create(
        body,
        currentUser,
      );

      expect(result).toBe(exception);
      expect(
        availabilityExceptionsService.create,
      ).toHaveBeenCalledWith(body, currentUser);
    });
  });

  describe('update', () => {
    it('passes the exception ID, request body, and current user to the service', async () => {
      const body = {
        reason: 'Updated meeting',
      };

      const exception = {
        id: exceptionId,
        facultyId,
        date: '2026-09-14',
        startTime: '10:00',
        endTime: '11:00',
        reason: 'Updated meeting',
      };

      availabilityExceptionsService.update.mockResolvedValue(
        exception,
      );

      const result = await controller.update(
        exceptionId,
        body,
        currentUser,
      );

      expect(result).toBe(exception);
      expect(
        availabilityExceptionsService.update,
      ).toHaveBeenCalledWith(
        exceptionId,
        body,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('passes the exception ID and current user to the service', async () => {
      await controller.remove(exceptionId, currentUser);

      expect(
        availabilityExceptionsService.remove,
      ).toHaveBeenCalledWith(
        exceptionId,
        currentUser,
      );
    });
  });
});
