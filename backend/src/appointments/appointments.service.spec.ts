import { jest } from '@jest/globals';

import { AppointmentsService } from './appointments.service.js';
import {
  AppointmentEntity,
  AppointmentStatus,
} from './entities/appointment.entity.js';

describe('AppointmentsService', () => {
  const appointmentsRepository = {
    find: jest.fn<() => Promise<unknown[]>>(),
    findOne: jest.fn<() => Promise<unknown | null>>(),
  };

  const studentsRepository = {
    findOne: jest.fn<() => Promise<unknown | null>>(),
  };

  const facultyRepository = {
    findOne: jest.fn<() => Promise<unknown | null>>(),
  };

  const notificationJobsRepository = {};

  const facultyService = {
    findById: jest.fn<() => Promise<unknown>>(),
  };

  const availabilitySchedulesService = {
    getAvailableSlots: jest.fn<
      () => Promise<Array<{ startTime: string; endTime: string }>>
    >(),
  };

  const manager = {
    findOne: jest.fn<() => Promise<unknown | null>>(),
    save: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => unknown>(),
  };

  type TransactionCallback = (
    transactionManager: typeof manager,
  ) => Promise<unknown>;

  const dataSource = {
    transaction: jest.fn<
      (callback: TransactionCallback) => Promise<unknown>
    >(),
  };

  let service: AppointmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    dataSource.transaction.mockImplementation(
      async (callback) => callback(manager),
    );

    service = new AppointmentsService(
      appointmentsRepository as never,
      studentsRepository as never,
      facultyRepository as never,
      notificationJobsRepository as never,
      facultyService as never,
      availabilitySchedulesService as never,
      dataSource as never,
    );
  });

  describe('create', () => {
    const student = {
      id: 'student-1',
      userId: 'student-user',
    };

    const faculty = {
      id: 'faculty-1',
      userId: 'faculty-user',
    };

    const dto = {
      facultyId: 'faculty-1',
      startTime: '2026-09-07T10:00:00.000Z',
      endTime: '2026-09-07T10:30:00.000Z',
      reason: '  Discuss project  ',
    };

    const setupCreateMocks = () => {
      studentsRepository.findOne.mockResolvedValue(student);
      facultyService.findById.mockResolvedValue(faculty);
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        {
          startTime: '10:00',
          endTime: '10:30',
        },
      ]);

      manager.create
        .mockReturnValueOnce({
          studentId: student.id,
          facultyId: faculty.id,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          reason: 'Discuss project',
          status: AppointmentStatus.PENDING,
        })
        .mockReturnValueOnce({});

      manager.save
        .mockResolvedValueOnce({
          id: 'appointment-1',
          status: AppointmentStatus.PENDING,
        })
        .mockResolvedValueOnce({});
    };

    it('should create a pending appointment and notification job', async () => {
      setupCreateMocks();

      const result = await service.create(dto, {
        id: 'student-user',
        role: 'STUDENT',
      });

      expect(result).toEqual({
        id: 'appointment-1',
        status: AppointmentStatus.PENDING,
      });

      expect(manager.create).toHaveBeenNthCalledWith(
        1,
        AppointmentEntity,
        expect.objectContaining({
          studentId: 'student-1',
          facultyId: 'faculty-1',
          reason: 'Discuss project',
          status: AppointmentStatus.PENDING,
        }),
      );

      expect(manager.create).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          type: 'APPOINTMENT_REQUESTED',
          recipientId: 'faculty-user',
          attempts: 0,
          payload: {
            appointmentId: 'appointment-1',
          },
        }),
      );

      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should reject non-students from creating appointments', async () => {
      await expect(
        service.create(dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Only students can create appointments');

      expect(studentsRepository.findOne).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject creation when the student profile is missing', async () => {
      studentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(dto, {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Student profile not found');

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject a time that is not a generated slot', async () => {
      studentsRepository.findOne.mockResolvedValue(student);
      facultyService.findById.mockResolvedValue(faculty);
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        {
          startTime: '10:00',
          endTime: '10:30',
        },
      ]);

      await expect(
        service.create(
          {
            ...dto,
            startTime: '2026-09-07T10:05:00.000Z',
            endTime: '2026-09-07T10:35:00.000Z',
          },
          {
            id: 'student-user',
            role: 'STUDENT',
          },
        ),
      ).rejects.toThrow(
        'Requested time is not an available appointment slot',
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject an arbitrary duration even when it overlaps a generated slot', async () => {
      studentsRepository.findOne.mockResolvedValue(student);
      facultyService.findById.mockResolvedValue(faculty);
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        {
          startTime: '10:00',
          endTime: '10:30',
        },
      ]);

      await expect(
        service.create(
          {
            ...dto,
            startTime: '2026-09-07T10:00:00.000Z',
            endTime: '2026-09-07T10:45:00.000Z',
          },
          {
            id: 'student-user',
            role: 'STUDENT',
          },
        ),
      ).rejects.toThrow(
        'Requested time is not an available appointment slot',
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should map the database exclusion violation to a conflict', async () => {
      setupCreateMocks();
      dataSource.transaction.mockRejectedValueOnce({
        code: '23P01',
      });

      await expect(
        service.create(dto, {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow(
        'The appointment slot is no longer available',
      );
    });

    it('should rethrow non-exclusion transaction errors', async () => {
      setupCreateMocks();
      dataSource.transaction.mockRejectedValueOnce(
        new Error('database failure'),
      );

      await expect(
        service.create(dto, {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('database failure');
    });

    it('should propagate notification save failure so the transaction can roll back', async () => {
      setupCreateMocks();

      manager.save.mockReset();
      manager.save
        .mockResolvedValueOnce({
          id: 'appointment-1',
          status: AppointmentStatus.PENDING,
        })
        .mockRejectedValueOnce(
          new Error('notification save failed'),
        );

      await expect(
        service.create(dto, {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('notification save failed');

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return all appointments for an admin', async () => {
      const appointments = [
        {
          id: 'appointment-1',
          studentId: 'student-1',
          facultyId: 'faculty-1',
          status: AppointmentStatus.PENDING,
        },
      ];

      appointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findAll({
        id: 'admin-user',
        role: 'ADMIN',
      });

      expect(result).toBe(appointments);
      expect(appointmentsRepository.find).toHaveBeenCalledWith({
        order: {
          startTime: 'ASC',
          createdAt: 'ASC',
        },
      });
    });

    it('should return only the current student appointments', async () => {
      const appointments = [
        {
          id: 'appointment-1',
          studentId: 'student-1',
        },
      ];

      studentsRepository.findOne.mockResolvedValue({
        id: 'student-1',
        userId: 'student-user',
      });
      appointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findAll({
        id: 'student-user',
        role: 'STUDENT',
      });

      expect(result).toBe(appointments);
    });

    it('should return only the current faculty appointments', async () => {
      const appointments = [
        {
          id: 'appointment-1',
          facultyId: 'faculty-1',
        },
      ];

      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });
      appointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findAll({
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(result).toBe(appointments);
    });

    it('should reject student list access when the student profile is missing', async () => {
      studentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findAll({
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Student profile not found');
    });

    it('should reject faculty list access when the faculty profile is missing', async () => {
      facultyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findAll({
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Faculty profile not found');
    });
  });

  describe('findById', () => {
    const appointment = {
      id: 'appointment-1',
      studentId: 'student-1',
      facultyId: 'faculty-1',
    };

    it('should return an appointment to an admin', async () => {
      appointmentsRepository.findOne.mockResolvedValue(appointment);

      const result = await service.findById('appointment-1', {
        id: 'admin-user',
        role: 'ADMIN',
      });

      expect(result).toBe(appointment);
    });

    it('should return an appointment to its student owner', async () => {
      appointmentsRepository.findOne.mockResolvedValue(appointment);
      studentsRepository.findOne.mockResolvedValue({
        id: 'student-1',
        userId: 'student-user',
      });

      const result = await service.findById('appointment-1', {
        id: 'student-user',
        role: 'STUDENT',
      });

      expect(result).toBe(appointment);
    });

    it('should forbid a student from viewing another student appointment', async () => {
      appointmentsRepository.findOne.mockResolvedValue(appointment);
      studentsRepository.findOne.mockResolvedValue({
        id: 'student-2',
        userId: 'student-user',
      });

      await expect(
        service.findById('appointment-1', {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow(
        'You can only view your own appointments',
      );
    });

    it('should return an appointment to its faculty owner', async () => {
      appointmentsRepository.findOne.mockResolvedValue(appointment);
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });

      const result = await service.findById('appointment-1', {
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(result).toBe(appointment);
    });

    it('should forbid a faculty member from viewing another faculty appointment', async () => {
      appointmentsRepository.findOne.mockResolvedValue(appointment);
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-2',
        userId: 'faculty-user',
      });

      await expect(
        service.findById('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'You can only view your own appointments',
      );
    });

    it('should return not found when the appointment does not exist', async () => {
      appointmentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findById('missing-id', {
          id: 'admin-user',
          role: 'ADMIN',
        }),
      ).rejects.toThrow('Appointment not found');
    });
  });

  describe('accept', () => {
    const pendingAppointment = {
      id: 'appointment-1',
      studentId: 'student-1',
      facultyId: 'faculty-1',
      status: AppointmentStatus.PENDING,
    };

    const setupFaculty = () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });
    };

    it('should confirm a pending appointment for its faculty owner', async () => {
      setupFaculty();

      const appointment = {
        ...pendingAppointment,
      };
      const savedAppointment = {
        ...appointment,
        status: AppointmentStatus.CONFIRMED,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });

      manager.save
        .mockResolvedValueOnce(savedAppointment)
        .mockResolvedValueOnce({});

      manager.create.mockReturnValue({});

      const result = await service.accept('appointment-1', {
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(result).toBe(savedAppointment);
      expect(appointment.status).toBe(
        AppointmentStatus.CONFIRMED,
      );
      expect(manager.findOne).toHaveBeenNthCalledWith(
        1,
        AppointmentEntity,
        {
          where: { id: 'appointment-1' },
          lock: {
            mode: 'pessimistic_write',
          },
        },
      );
      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'APPOINTMENT_CONFIRMED',
          recipientId: 'student-user',
          payload: {
            appointmentId: 'appointment-1',
          },
        }),
      );
    });

    it('should reject accept when the faculty profile is missing', async () => {
      facultyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.accept('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Faculty profile not found');
    });

    it('should forbid a student from accepting an appointment', async () => {
      await expect(
        service.accept('appointment-1', {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Only faculty can accept appointments');
    });

    it('should forbid a faculty member from managing another faculty appointment', async () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-2',
        userId: 'faculty-user',
      });

      manager.findOne.mockResolvedValue({
        ...pendingAppointment,
      });

      await expect(
        service.accept('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'You can only manage your own appointments',
      );
    });

    it('should reject accepting a non-pending appointment', async () => {
      setupFaculty();

      manager.findOne.mockResolvedValue({
        ...pendingAppointment,
        status: AppointmentStatus.CONFIRMED,
      });

      await expect(
        service.accept('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'Only pending appointments can be accepted or rejected',
      );
    });

    it('should return not found when accepting a missing appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.accept('missing-id', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Appointment not found');
    });

    it('should propagate student profile failure and abort notification creation', async () => {
      setupFaculty();

      const appointment = {
        ...pendingAppointment,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce(null);

      manager.save.mockResolvedValueOnce({
        ...appointment,
        status: AppointmentStatus.CONFIRMED,
      });

      await expect(
        service.accept('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Student profile not found');

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate notification save failure', async () => {
      setupFaculty();

      const appointment = {
        ...pendingAppointment,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });

      manager.save
        .mockResolvedValueOnce({
          ...appointment,
          status: AppointmentStatus.CONFIRMED,
        })
        .mockRejectedValueOnce(
          new Error('notification save failed'),
        );

      manager.create.mockReturnValue({});

      await expect(
        service.accept('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('notification save failed');

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancel', () => {
    const confirmedAppointment = {
      id: 'appointment-1',
      studentId: 'student-1',
      facultyId: 'faculty-1',
      status: AppointmentStatus.CONFIRMED,
      startTime: new Date('2026-09-07T10:00:00.000Z'),
      endTime: new Date('2026-09-07T10:30:00.000Z'),
      reason: 'Discuss project',
    };

    const setupFaculty = () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });
    };

    it('should cancel a confirmed appointment and create a notification job', async () => {
      setupFaculty();

      const appointment = { ...confirmedAppointment };
      const savedAppointment = {
        ...appointment,
        status: AppointmentStatus.CANCELLED,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });
      manager.save
        .mockResolvedValueOnce(savedAppointment)
        .mockResolvedValueOnce({});
      manager.create.mockReturnValue({});

      const result = await service.cancel('appointment-1', {
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(result).toBe(savedAppointment);
      expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
      expect(manager.findOne).toHaveBeenNthCalledWith(
        1,
        AppointmentEntity,
        {
          where: { id: 'appointment-1' },
          lock: { mode: 'pessimistic_write' },
        },
      );
      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'APPOINTMENT_CANCELLED',
          recipientId: 'student-user',
          payload: { appointmentId: 'appointment-1' },
        }),
      );
      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should forbid a student from cancelling an appointment', async () => {
      await expect(
        service.cancel('appointment-1', {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Only faculty can cancel appointments');

      expect(facultyRepository.findOne).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject cancellation when the faculty profile is missing', async () => {
      facultyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancel('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Faculty profile not found');

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should return not found when cancelling a missing appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.cancel('missing-id', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Appointment not found');
    });

    it('should forbid a faculty member from cancelling another faculty appointment', async () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-2',
        userId: 'faculty-user',
      });
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
      });

      await expect(
        service.cancel('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('You can only manage your own appointments');
    });

    it('should reject cancelling a non-confirmed appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
        status: AppointmentStatus.PENDING,
      });

      await expect(
        service.cancel('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Only confirmed appointments can be cancelled');
    });

    it('should propagate student profile failure and abort notification creation', async () => {
      setupFaculty();

      manager.findOne
        .mockResolvedValueOnce({ ...confirmedAppointment })
        .mockResolvedValueOnce(null);
      manager.save.mockResolvedValueOnce({
        ...confirmedAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      await expect(
        service.cancel('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Student profile not found');

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate notification save failure', async () => {
      setupFaculty();

      manager.findOne
        .mockResolvedValueOnce({ ...confirmedAppointment })
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });
      manager.save
        .mockResolvedValueOnce({
          ...confirmedAppointment,
          status: AppointmentStatus.CANCELLED,
        })
        .mockRejectedValueOnce(new Error('notification save failed'));
      manager.create.mockReturnValue({});

      await expect(
        service.cancel('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('notification save failed');

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('reschedule', () => {
    const confirmedAppointment = {
      id: 'appointment-1',
      studentId: 'student-1',
      facultyId: 'faculty-1',
      status: AppointmentStatus.CONFIRMED,
      startTime: new Date('2026-09-07T10:00:00.000Z'),
      endTime: new Date('2026-09-07T10:30:00.000Z'),
      reason: 'Discuss project',
    };

    const dto = {
      startTime: '2026-09-07T11:00:00.000Z',
      endTime: '2026-09-07T11:30:00.000Z',
    };

    const setupFaculty = () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });
    };

    const setupRescheduleMocks = () => {
      setupFaculty();
      const appointment = { ...confirmedAppointment };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });

      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        { startTime: '11:00', endTime: '11:30' },
      ]);

      const savedAppointment = {
        ...appointment,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      };

      manager.save
        .mockResolvedValueOnce(savedAppointment)
        .mockResolvedValueOnce({});
      manager.create.mockReturnValue({});

      return { appointment, savedAppointment };
    };

    it('should reschedule the same confirmed appointment and create a notification job', async () => {
      const { appointment, savedAppointment } = setupRescheduleMocks();

      const result = await service.reschedule(
        'appointment-1',
        dto,
        {
          id: 'faculty-user',
          role: 'FACULTY',
        },
      );

      expect(result).toBe(savedAppointment);
      expect(appointment.id).toBe('appointment-1');
      expect(appointment.studentId).toBe('student-1');
      expect(appointment.facultyId).toBe('faculty-1');
      expect(appointment.reason).toBe('Discuss project');
      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.startTime).toEqual(new Date(dto.startTime));
      expect(appointment.endTime).toEqual(new Date(dto.endTime));

      expect(
        availabilitySchedulesService.getAvailableSlots,
      ).toHaveBeenCalledWith(
        'faculty-1',
        '2026-09-07',
        'appointment-1',
      );

      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'APPOINTMENT_RESCHEDULED',
          recipientId: 'student-user',
          payload: { appointmentId: 'appointment-1' },
        }),
      );
      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should forbid a student from rescheduling an appointment', async () => {
      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Only faculty can reschedule appointments');

      expect(facultyRepository.findOne).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject rescheduling when the faculty profile is missing', async () => {
      facultyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Faculty profile not found');

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should return not found when rescheduling a missing appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.reschedule('missing-id', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Appointment not found');
    });

    it('should forbid a faculty member from rescheduling another faculty appointment', async () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-2',
        userId: 'faculty-user',
      });
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
      });

      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('You can only manage your own appointments');
    });

    it('should reject rescheduling a non-confirmed appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
        status: AppointmentStatus.PENDING,
      });

      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'Only confirmed appointments can be rescheduled',
      );

      expect(
        availabilitySchedulesService.getAvailableSlots,
      ).not.toHaveBeenCalled();
    });

    it('should reject a time that is not a generated slot', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
      });
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        { startTime: '11:00', endTime: '11:30' },
      ]);

      await expect(
        service.reschedule(
          'appointment-1',
          {
            startTime: '2026-09-07T11:05:00.000Z',
            endTime: '2026-09-07T11:35:00.000Z',
          },
          {
            id: 'faculty-user',
            role: 'FACULTY',
          },
        ),
      ).rejects.toThrow(
        'Requested time is not an available appointment slot',
      );

      expect(manager.save).not.toHaveBeenCalled();
    });

    it('should pass the current appointment id so its own slot does not block rescheduling', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
      });
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        { startTime: '11:00', endTime: '11:30' },
      ]);

      manager.save.mockResolvedValue({
        ...confirmedAppointment,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      });

      await service.reschedule('appointment-1', dto, {
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(
        availabilitySchedulesService.getAvailableSlots,
      ).toHaveBeenCalledWith(
        'faculty-1',
        '2026-09-07',
        'appointment-1',
      );
    });

    it('should map a database exclusion violation to a conflict', async () => {
      setupRescheduleMocks();
      dataSource.transaction.mockRejectedValueOnce({
        code: '23P01',
      });

      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('The appointment slot is no longer available');
    });

    it('should propagate student profile failure and abort notification creation', async () => {
      setupFaculty();
      manager.findOne
        .mockResolvedValueOnce({ ...confirmedAppointment })
        .mockResolvedValueOnce(null);
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        { startTime: '11:00', endTime: '11:30' },
      ]);
      manager.save.mockResolvedValueOnce({
        ...confirmedAppointment,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      });

      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Student profile not found');

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate notification save failure', async () => {
      setupFaculty();
      manager.findOne
        .mockResolvedValueOnce({ ...confirmedAppointment })
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });
      availabilitySchedulesService.getAvailableSlots.mockResolvedValue([
        { startTime: '11:00', endTime: '11:30' },
      ]);
      manager.save
        .mockResolvedValueOnce({
          ...confirmedAppointment,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
        })
        .mockRejectedValueOnce(new Error('notification save failed'));
      manager.create.mockReturnValue({});

      await expect(
        service.reschedule('appointment-1', dto, {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('notification save failed');

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('complete', () => {
    const confirmedAppointment = {
      id: 'appointment-1',
      studentId: 'student-1',
      facultyId: 'faculty-1',
      status: AppointmentStatus.CONFIRMED,
    };

    const setupFaculty = () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });
    };

    it('should complete a confirmed appointment and create a notification job', async () => {
      setupFaculty();

      const appointment = { ...confirmedAppointment };
      const savedAppointment = {
        ...appointment,
        status: AppointmentStatus.COMPLETED,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });
      manager.save
        .mockResolvedValueOnce(savedAppointment)
        .mockResolvedValueOnce({});
      manager.create.mockReturnValue({});

      const result = await service.complete('appointment-1', {
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(result).toBe(savedAppointment);
      expect(appointment.status).toBe(AppointmentStatus.COMPLETED);
      expect(manager.findOne).toHaveBeenNthCalledWith(
        1,
        AppointmentEntity,
        {
          where: { id: 'appointment-1' },
          lock: { mode: 'pessimistic_write' },
        },
      );
      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'APPOINTMENT_COMPLETED',
          recipientId: 'student-user',
          payload: { appointmentId: 'appointment-1' },
        }),
      );
      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should forbid a student from completing an appointment', async () => {
      await expect(
        service.complete('appointment-1', {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Only faculty can complete appointments');

      expect(facultyRepository.findOne).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject completion when the faculty profile is missing', async () => {
      facultyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.complete('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Faculty profile not found');

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should return not found when completing a missing appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.complete('missing-id', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Appointment not found');
    });

    it('should forbid a faculty member from completing another faculty appointment', async () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-2',
        userId: 'faculty-user',
      });
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
      });

      await expect(
        service.complete('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('You can only manage your own appointments');
    });

    it('should reject completing a non-confirmed appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue({
        ...confirmedAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      await expect(
        service.complete('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Only confirmed appointments can be completed');
    });

    it('should propagate student profile failure and abort notification creation', async () => {
      setupFaculty();

      manager.findOne
        .mockResolvedValueOnce({ ...confirmedAppointment })
        .mockResolvedValueOnce(null);
      manager.save.mockResolvedValueOnce({
        ...confirmedAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      await expect(
        service.complete('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Student profile not found');

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate notification save failure', async () => {
      setupFaculty();

      manager.findOne
        .mockResolvedValueOnce({ ...confirmedAppointment })
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });
      manager.save
        .mockResolvedValueOnce({
          ...confirmedAppointment,
          status: AppointmentStatus.COMPLETED,
        })
        .mockRejectedValueOnce(new Error('notification save failed'));
      manager.create.mockReturnValue({});

      await expect(
        service.complete('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('notification save failed');

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('reject', () => {
    const pendingAppointment = {
      id: 'appointment-1',
      studentId: 'student-1',
      facultyId: 'faculty-1',
      status: AppointmentStatus.PENDING,
    };

    const setupFaculty = () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-1',
        userId: 'faculty-user',
      });
    };

    it('should reject a pending appointment for its faculty owner', async () => {
      setupFaculty();

      const appointment = {
        ...pendingAppointment,
      };
      const savedAppointment = {
        ...appointment,
        status: AppointmentStatus.REJECTED,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });

      manager.save
        .mockResolvedValueOnce(savedAppointment)
        .mockResolvedValueOnce({});

      manager.create.mockReturnValue({});

      const result = await service.reject('appointment-1', {
        id: 'faculty-user',
        role: 'FACULTY',
      });

      expect(result).toBe(savedAppointment);
      expect(appointment.status).toBe(
        AppointmentStatus.REJECTED,
      );
      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'APPOINTMENT_REJECTED',
          recipientId: 'student-user',
          payload: {
            appointmentId: 'appointment-1',
          },
        }),
      );
    });

    it('should forbid a student from rejecting an appointment', async () => {
      await expect(
        service.reject('appointment-1', {
          id: 'student-user',
          role: 'STUDENT',
        }),
      ).rejects.toThrow('Only faculty can reject appointments');
    });

    it('should reject rejecting a non-pending appointment', async () => {
      setupFaculty();

      manager.findOne.mockResolvedValue({
        ...pendingAppointment,
        status: AppointmentStatus.REJECTED,
      });

      await expect(
        service.reject('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'Only pending appointments can be accepted or rejected',
      );
    });

    it('should reject rejecting a confirmed appointment', async () => {
      setupFaculty();

      manager.findOne.mockResolvedValue({
        ...pendingAppointment,
        status: AppointmentStatus.CONFIRMED,
      });

      await expect(
        service.reject('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'Only pending appointments can be accepted or rejected',
      );
    });

    it('should forbid a faculty member from rejecting another faculty appointment', async () => {
      facultyRepository.findOne.mockResolvedValue({
        id: 'faculty-2',
        userId: 'faculty-user',
      });

      manager.findOne.mockResolvedValue({
        ...pendingAppointment,
      });

      await expect(
        service.reject('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow(
        'You can only manage your own appointments',
      );
    });

    it('should return not found when rejecting a missing appointment', async () => {
      setupFaculty();
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.reject('missing-id', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Appointment not found');
    });

    it('should propagate student profile failure and abort notification creation', async () => {
      setupFaculty();

      const appointment = {
        ...pendingAppointment,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce(null);

      manager.save.mockResolvedValueOnce({
        ...appointment,
        status: AppointmentStatus.REJECTED,
      });

      await expect(
        service.reject('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('Student profile not found');

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate notification save failure', async () => {
      setupFaculty();

      const appointment = {
        ...pendingAppointment,
      };

      manager.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({
          id: 'student-1',
          userId: 'student-user',
        });

      manager.save
        .mockResolvedValueOnce({
          ...appointment,
          status: AppointmentStatus.REJECTED,
        })
        .mockRejectedValueOnce(
          new Error('notification save failed'),
        );

      manager.create.mockReturnValue({});

      await expect(
        service.reject('appointment-1', {
          id: 'faculty-user',
          role: 'FACULTY',
        }),
      ).rejects.toThrow('notification save failed');

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });
});
