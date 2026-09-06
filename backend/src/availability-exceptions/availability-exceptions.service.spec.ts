import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';

import { AvailabilityExceptionEntity } from './entities/availability-exception.entity.js';
import { AvailabilityExceptionsService } from './availability-exceptions.service.js';

describe('AvailabilityExceptionsService', () => {
  const facultyId = 'faculty-1';
  const otherFacultyId = 'faculty-2';
  const userId = 'user-1';
  const otherUserId = 'user-2';

  const faculty = {
    id: facultyId,
    userId,
  };

  const otherFaculty = {
    id: otherFacultyId,
    userId: otherUserId,
  };

  const facultyService = {
    findById: jest.fn(
      async (id: string) => {
        if (id === facultyId) {
          return faculty;
        }

        if (id === otherFacultyId) {
          return otherFaculty;
        }

        throw new NotFoundException('Faculty not found');
      },
    ),
  };

  const exceptionsRepository = {
    find: jest.fn(
      async (): Promise<AvailabilityExceptionEntity[]> => [],
    ),
    findOne: jest.fn(
      async (): Promise<AvailabilityExceptionEntity | null> => null,
    ),
    create: jest.fn(
      (data: Partial<AvailabilityExceptionEntity>) =>
        data as AvailabilityExceptionEntity,
    ),
    save: jest.fn(
      async (
        exception: AvailabilityExceptionEntity,
      ): Promise<AvailabilityExceptionEntity> => exception,
    ),
    remove: jest.fn(
      async (
        exception: AvailabilityExceptionEntity,
      ): Promise<AvailabilityExceptionEntity> => exception,
    ),
  };

  const service = new AvailabilityExceptionsService(
    exceptionsRepository as never,
    facultyService as never,
  );

  const facultyUser = {
    id: userId,
    role: 'FACULTY' as const,
  };

  const otherFacultyUser = {
    id: otherUserId,
    role: 'FACULTY' as const,
  };

  const adminUser = {
    id: 'admin-1',
    role: 'ADMIN' as const,
  };

  const studentUser = {
    id: 'student-1',
    role: 'STUDENT' as const,
  };

  const wholeDayException = {
    id: 'exception-1',
    facultyId,
    date: '2026-09-14',
    startTime: null,
    endTime: null,
    reason: 'Leave',
  } as AvailabilityExceptionEntity;

  const partialDayException = {
    id: 'exception-2',
    facultyId,
    date: '2026-09-15',
    startTime: '10:00',
    endTime: '11:30',
    reason: 'Meeting',
  } as AvailabilityExceptionEntity;

  beforeEach(() => {
    jest.clearAllMocks();

    exceptionsRepository.find.mockResolvedValue([]);
    exceptionsRepository.findOne.mockResolvedValue(null);
    exceptionsRepository.create.mockImplementation(
      (data: Partial<AvailabilityExceptionEntity>) =>
        data as AvailabilityExceptionEntity,
    );
    exceptionsRepository.save.mockImplementation(
      async (exception: AvailabilityExceptionEntity) =>
        exception,
    );
    exceptionsRepository.remove.mockImplementation(
      async (exception: AvailabilityExceptionEntity) =>
        exception,
    );

    facultyService.findById.mockImplementation(
      async (id: string) => {
        if (id === facultyId) {
          return faculty;
        }

        if (id === otherFacultyId) {
          return otherFaculty;
        }

        throw new NotFoundException('Faculty not found');
      },
    );
  });

  describe('findAllForFaculty', () => {
    it('returns all exceptions for a faculty member ordered by date and start time', async () => {
      exceptionsRepository.find.mockResolvedValue([
        wholeDayException,
        partialDayException,
      ]);

      const result = await service.findAllForFaculty(facultyId);

      expect(result).toEqual([
        wholeDayException,
        partialDayException,
      ]);
      expect(facultyService.findById).toHaveBeenCalledWith(
        facultyId,
      );
      expect(exceptionsRepository.find).toHaveBeenCalledWith({
        where: { facultyId },
        order: {
          date: 'ASC',
          startTime: 'ASC',
        },
      });
    });

    it('throws when the faculty does not exist', async () => {
      await expect(
        service.findAllForFaculty('missing-faculty'),
      ).rejects.toThrow(NotFoundException);

      expect(exceptionsRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns the exception when it exists', async () => {
      exceptionsRepository.findOne.mockResolvedValue(
        wholeDayException,
      );

      const result = await service.findById(
        wholeDayException.id,
      );

      expect(result).toBe(wholeDayException);
      expect(exceptionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: wholeDayException.id },
      });
    });

    it('throws NotFoundException when the exception does not exist', async () => {
      await expect(
        service.findById('missing-exception'),
      ).rejects.toThrow(
        new NotFoundException(
          'Availability exception not found',
        ),
      );
    });
  });

  describe('create', () => {
    it('creates a whole-day exception', async () => {
      const data = {
        facultyId,
        date: '2026-09-14',
        reason: 'Leave',
      };

      const createdException = {
        facultyId,
        date: '2026-09-14',
        startTime: null,
        endTime: null,
        reason: 'Leave',
      } as AvailabilityExceptionEntity;

      exceptionsRepository.create.mockReturnValue(
        createdException,
      );
      exceptionsRepository.save.mockResolvedValue(
        createdException,
      );

      const result = await service.create(
        data,
        facultyUser,
      );

      expect(result).toBe(createdException);
      expect(exceptionsRepository.create).toHaveBeenCalledWith({
        facultyId,
        date: '2026-09-14',
        startTime: null,
        endTime: null,
        reason: 'Leave',
      });
      expect(exceptionsRepository.save).toHaveBeenCalledWith(
        createdException,
      );
    });

    it('creates a partial-day exception', async () => {
      const data = {
        facultyId,
        date: '2026-09-15',
        startTime: '10:00',
        endTime: '11:30',
        reason: 'Meeting',
      };

      const createdException = {
        facultyId,
        date: '2026-09-15',
        startTime: '10:00',
        endTime: '11:30',
        reason: 'Meeting',
      } as AvailabilityExceptionEntity;

      exceptionsRepository.create.mockReturnValue(
        createdException,
      );
      exceptionsRepository.save.mockResolvedValue(
        createdException,
      );

      const result = await service.create(
        data,
        facultyUser,
      );

      expect(result).toBe(createdException);
      expect(exceptionsRepository.create).toHaveBeenCalledWith({
        facultyId,
        date: '2026-09-15',
        startTime: '10:00',
        endTime: '11:30',
        reason: 'Meeting',
      });
    });

    it('allows an administrator to create an exception for any faculty member', async () => {
      const data = {
        facultyId: otherFacultyId,
        date: '2026-09-16',
        startTime: '13:00',
        endTime: '14:00',
      };

      const createdException = {
        facultyId: otherFacultyId,
        date: '2026-09-16',
        startTime: '13:00',
        endTime: '14:00',
        reason: null,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.create.mockReturnValue(
        createdException,
      );
      exceptionsRepository.save.mockResolvedValue(
        createdException,
      );

      await service.create(data, adminUser);

      expect(exceptionsRepository.create).toHaveBeenCalledWith({
        facultyId: otherFacultyId,
        date: '2026-09-16',
        startTime: '13:00',
        endTime: '14:00',
        reason: null,
      });
    });

    it('rejects a student from creating an exception', async () => {
      const data = {
        facultyId,
        date: '2026-09-17',
      };

      await expect(
        service.create(data, studentUser),
      ).rejects.toThrow(
        new ForbiddenException(
          'Only faculty members or administrators can manage availability',
        ),
      );

      expect(exceptionsRepository.create).not.toHaveBeenCalled();
      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a faculty member from creating an exception for another faculty member', async () => {
      const data = {
        facultyId: otherFacultyId,
        date: '2026-09-17',
      };

      await expect(
        service.create(data, facultyUser),
      ).rejects.toThrow(
        new ForbiddenException(
          'You can only manage your own availability',
        ),
      );

      expect(exceptionsRepository.create).not.toHaveBeenCalled();
      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('throws when the target faculty does not exist', async () => {
      const data = {
        facultyId: 'missing-faculty',
        date: '2026-09-17',
      };

      await expect(
        service.create(data, adminUser),
      ).rejects.toThrow(NotFoundException);

      expect(exceptionsRepository.create).not.toHaveBeenCalled();
    });

    it('converts a database unique violation into ConflictException', async () => {
      const data = {
        facultyId,
        date: '2026-09-18',
      };

      exceptionsRepository.save.mockRejectedValue({
        code: '23505',
      });

      await expect(
        service.create(data, facultyUser),
      ).rejects.toThrow(
        new ConflictException(
          'Availability exception already exists',
        ),
      );
    });

    it('rethrows non-unique database errors', async () => {
      const databaseError = new Error('Database unavailable');

      exceptionsRepository.save.mockRejectedValue(
        databaseError,
      );

      await expect(
        service.create(
          {
            facultyId,
            date: '2026-09-19',
          },
          facultyUser,
        ),
      ).rejects.toBe(databaseError);
    });
  });

  describe('update', () => {
    it('updates a whole-day exception to another date', async () => {
      const exception = {
        ...wholeDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      const result = await service.update(
        exception.id,
        {
          date: '2026-09-20',
        },
        facultyUser,
      );

      expect(result).toBe(exception);
      expect(exception).toMatchObject({
        date: '2026-09-20',
        startTime: null,
        endTime: null,
        reason: 'Leave',
      });
      expect(exceptionsRepository.save).toHaveBeenCalledWith(
        exception,
      );
    });

    it('updates a whole-day exception to a partial-day exception', async () => {
      const exception = {
        ...wholeDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await service.update(
        exception.id,
        {
          startTime: '09:00',
          endTime: '10:00',
          reason: 'Meeting',
        },
        facultyUser,
      );

      expect(exception).toMatchObject({
        date: '2026-09-14',
        startTime: '09:00',
        endTime: '10:00',
        reason: 'Meeting',
      });
    });

    it('updates a partial-day exception to a whole-day exception', async () => {
      const exception = {
        ...partialDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await service.update(
        exception.id,
        {
          startTime: null,
          endTime: null,
        },
        facultyUser,
      );

      expect(exception).toMatchObject({
        startTime: null,
        endTime: null,
      });
    });

    it('updates the reason without changing the existing time range', async () => {
      const exception = {
        ...partialDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await service.update(
        exception.id,
        {
          reason: 'Updated meeting',
        },
        facultyUser,
      );

      expect(exception).toMatchObject({
        startTime: '10:00',
        endTime: '11:30',
        reason: 'Updated meeting',
      });
    });

    it('rejects an update with only a start time', async () => {
      const exception = {
        ...wholeDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await expect(
        service.update(
          exception.id,
          {
            startTime: '10:00',
          },
          facultyUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Partial availability exception requires both start and end times',
        ),
      );

      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects an update with only an end time', async () => {
      const exception = {
        ...wholeDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await expect(
        service.update(
          exception.id,
          {
            endTime: '11:00',
          },
          facultyUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Partial availability exception requires both start and end times',
        ),
      );

      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects an update when start time is not earlier than end time', async () => {
      const exception = {
        ...wholeDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await expect(
        service.update(
          exception.id,
          {
            startTime: '12:00',
            endTime: '12:00',
          },
          facultyUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Exception start time must be earlier than end time',
        ),
      );

      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects an update when start time is after end time', async () => {
      const exception = {
        ...wholeDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await expect(
        service.update(
          exception.id,
          {
            startTime: '14:00',
            endTime: '13:00',
          },
          facultyUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Exception start time must be earlier than end time',
        ),
      );

      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a faculty member from updating another faculty member exception', async () => {
      const exception = {
        ...partialDayException,
        facultyId: otherFacultyId,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await expect(
        service.update(
          exception.id,
          { reason: 'Attempted update' },
          facultyUser,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You can only manage your own availability',
        ),
      );

      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('allows an administrator to update any faculty member exception', async () => {
      const exception = {
        ...partialDayException,
        facultyId: otherFacultyId,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await service.update(
        exception.id,
        { reason: 'Admin update' },
        adminUser,
      );

      expect(exception.reason).toBe('Admin update');
      expect(exceptionsRepository.save).toHaveBeenCalledWith(
        exception,
      );
    });

    it('throws NotFoundException when updating a missing exception', async () => {
      await expect(
        service.update(
          'missing-exception',
          { reason: 'Update' },
          facultyUser,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Availability exception not found',
        ),
      );

      expect(exceptionsRepository.save).not.toHaveBeenCalled();
    });

    it('converts a database unique violation during update into ConflictException', async () => {
      const exception = {
        ...partialDayException,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);
      exceptionsRepository.save.mockRejectedValue({
        code: '23505',
      });

      await expect(
        service.update(
          exception.id,
          { reason: 'Updated' },
          facultyUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Availability exception already exists',
        ),
      );
    });

    it('rethrows non-unique database errors during update', async () => {
      const exception = {
        ...partialDayException,
      } as AvailabilityExceptionEntity;
      const databaseError = new Error('Database unavailable');

      exceptionsRepository.findOne.mockResolvedValue(exception);
      exceptionsRepository.save.mockRejectedValue(
        databaseError,
      );

      await expect(
        service.update(
          exception.id,
          { reason: 'Updated' },
          facultyUser,
        ),
      ).rejects.toBe(databaseError);
    });
  });

  describe('remove', () => {
    it('removes an exception owned by the faculty member', async () => {
      exceptionsRepository.findOne.mockResolvedValue(
        wholeDayException,
      );

      await service.remove(
        wholeDayException.id,
        facultyUser,
      );

      expect(exceptionsRepository.remove).toHaveBeenCalledWith(
        wholeDayException,
      );
    });

    it('allows an administrator to remove any faculty member exception', async () => {
      const exception = {
        ...partialDayException,
        facultyId: otherFacultyId,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await service.remove(exception.id, adminUser);

      expect(exceptionsRepository.remove).toHaveBeenCalledWith(
        exception,
      );
    });

    it('rejects a faculty member from removing another faculty member exception', async () => {
      const exception = {
        ...partialDayException,
        facultyId: otherFacultyId,
      } as AvailabilityExceptionEntity;

      exceptionsRepository.findOne.mockResolvedValue(exception);

      await expect(
        service.remove(exception.id, facultyUser),
      ).rejects.toThrow(
        new ForbiddenException(
          'You can only manage your own availability',
        ),
      );

      expect(exceptionsRepository.remove).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when removing a missing exception', async () => {
      await expect(
        service.remove('missing-exception', facultyUser),
      ).rejects.toThrow(
        new NotFoundException(
          'Availability exception not found',
        ),
      );

      expect(exceptionsRepository.remove).not.toHaveBeenCalled();
    });
  });
});
