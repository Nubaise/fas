import { jest } from '@jest/globals';

import { NotificationJobsService } from './notification-jobs.service.js';
import {
  NotificationJobEntity,
  NotificationJobStatus,
} from './entities/notification-job.entity.js';

describe('NotificationJobsService', () => {
  type MockFn = ReturnType<typeof jest.fn>;

  const createService = () => {
    const notificationJobsRepository = {
      find: jest.fn() as MockFn,
      update: jest.fn() as MockFn,
    };

    const notificationsRepository = {
      findOne: jest.fn() as MockFn,
    };

    const appointmentsRepository = {
      findOne: jest.fn() as MockFn,
    };

    const usersRepository = {
      findOne: jest.fn() as MockFn,
    };

    const emailDelivery = {
      send: jest.fn() as MockFn,
    };

    const notificationContentService = {
      build: jest.fn() as MockFn,
    };

    const queryBuilder = {
      setLock: jest.fn() as MockFn,
      setOnLocked: jest.fn() as MockFn,
      where: jest.fn() as MockFn,
      andWhere: jest.fn() as MockFn,
      orderBy: jest.fn() as MockFn,
      addOrderBy: jest.fn() as MockFn,
      getOne: jest.fn() as MockFn,
    };

    type TestManager = {
      createQueryBuilder: MockFn;
      create: MockFn;
      save: MockFn;
    };

    const manager: TestManager = {
      createQueryBuilder: jest.fn() as MockFn,
      create: jest.fn() as MockFn,
      save: jest.fn() as MockFn,
    };

    manager.createQueryBuilder.mockReturnValue(queryBuilder);
    manager.create.mockImplementation(
      (_entity: unknown, value: unknown) => value,
    );
    manager.save.mockImplementation(
      async (_entity: unknown, value: unknown) => value,
    );

    const dataSource = {
      transaction: jest.fn(
        async (callback: (manager: TestManager) => unknown) =>
          callback(manager),
      ) as MockFn,
    };

    const service = new NotificationJobsService(
      notificationJobsRepository as never,
      notificationsRepository as never,
      appointmentsRepository as never,
      usersRepository as never,
      emailDelivery as never,
      notificationContentService as never,
      dataSource as never,
    );

    return {
      service,
      notificationJobsRepository,
      notificationsRepository,
      appointmentsRepository,
      usersRepository,
      emailDelivery,
      notificationContentService,
      manager,
      queryBuilder,
      dataSource,
    };
  };

  const createJob = (
    overrides: Partial<NotificationJobEntity> = {},
  ): NotificationJobEntity =>
    ({
      id: 'job-1',
      type: 'APPOINTMENT_CONFIRMED',
      recipientId: 'user-1',
      payload: {
        appointmentId: 'appointment-1',
      },
      status: NotificationJobStatus.PENDING,
      attempts: 0,
      availableAt: new Date(Date.now() - 1_000),
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as NotificationJobEntity;

  const setupClaimQuery = (
    queryBuilder: ReturnType<typeof createService>['queryBuilder'],
    job: NotificationJobEntity | null,
  ) => {
    queryBuilder.setLock.mockReturnValue(queryBuilder);
    queryBuilder.setOnLocked.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
    queryBuilder.getOne.mockResolvedValue(job);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when no pending job is available', async () => {
    const {
      service,
      notificationJobsRepository,
      queryBuilder,
    } = createService();

    notificationJobsRepository.find.mockResolvedValue([]);
    setupClaimQuery(queryBuilder, null);

    await expect(service.processNext()).resolves.toBe(false);

    expect(queryBuilder.getOne).toHaveBeenCalled();
  });

  it('processes a pending job and completes it after email delivery succeeds', async () => {
    const {
      service,
      notificationJobsRepository,
      notificationsRepository,
      usersRepository,
      appointmentsRepository,
      emailDelivery,
      notificationContentService,
      manager,
      queryBuilder,
    } = createService();

    const job = createJob();

    notificationJobsRepository.find.mockResolvedValue([]);
    setupClaimQuery(queryBuilder, job);

    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    manager.save.mockImplementation(
      async (_entity: unknown, value: unknown) => value,
    );

    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      isActive: true,
    });

    appointmentsRepository.findOne.mockResolvedValue({
      id: 'appointment-1',
    });

    notificationContentService.build.mockReturnValue({
      title: 'Appointment confirmed',
      message: 'Your faculty appointment has been confirmed.',
    });

    emailDelivery.send.mockResolvedValue(undefined);

    await expect(service.processNext()).resolves.toBe(true);

    expect(notificationContentService.build).toHaveBeenCalledWith(job);

    expect(emailDelivery.send).toHaveBeenCalledWith({
      to: 'student@example.com',
      subject: 'Appointment confirmed',
      text: 'Your faculty appointment has been confirmed.',
      idempotencyKey: 'job-1',
    });

    expect(notificationJobsRepository.update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        status: NotificationJobStatus.COMPLETED,
      }),
    );

    expect(manager.create).toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalled();
  });

  it('creates a separate notification for each job even when the type is the same', async () => {
    const {
      service,
      notificationJobsRepository,
      usersRepository,
      appointmentsRepository,
      emailDelivery,
      notificationContentService,
      manager,
      queryBuilder,
    } = createService();

    const firstJob = createJob({
      id: 'job-1',
    });

    const secondJob = createJob({
      id: 'job-2',
    });

    notificationJobsRepository.find.mockResolvedValue([]);
    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      isActive: true,
    });

    appointmentsRepository.findOne.mockResolvedValue({
      id: 'appointment-1',
    });

    notificationContentService.build.mockReturnValue({
      title: 'Appointment confirmed',
      message: 'Your faculty appointment has been confirmed.',
    });

    emailDelivery.send.mockResolvedValue(undefined);

    setupClaimQuery(queryBuilder, firstJob);
    await expect(service.processNext()).resolves.toBe(true);

    setupClaimQuery(queryBuilder, secondJob);
    await expect(service.processNext()).resolves.toBe(true);

    expect(manager.create).toHaveBeenCalledTimes(2);
    // Each job is saved once when claimed and once when its
    // notification record is persisted.
    expect(manager.save).toHaveBeenCalledTimes(4);
    expect(emailDelivery.send).toHaveBeenCalledTimes(2);

    const notificationCreates = manager.create.mock.calls.filter(
      ([, value]) =>
        value &&
        typeof value === 'object' &&
        'userId' in value &&
        'type' in value &&
        'title' in value &&
        'message' in value,
    );

    expect(notificationCreates).toHaveLength(2);
    expect(notificationCreates[0][1]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        type: 'APPOINTMENT_CONFIRMED',
      }),
    );
    expect(notificationCreates[1][1]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        type: 'APPOINTMENT_CONFIRMED',
      }),
    );
  });

  it('retries a transient email failure with bounded backoff', async () => {
    const {
      service,
      notificationJobsRepository,
      usersRepository,
      appointmentsRepository,
      emailDelivery,
      notificationContentService,
      manager,
      queryBuilder,
    } = createService();

    const job = createJob({
      attempts: 1,
    });

    notificationJobsRepository.find.mockResolvedValue([]);
    setupClaimQuery(queryBuilder, job);

    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      isActive: true,
    });

    appointmentsRepository.findOne.mockResolvedValue({
      id: 'appointment-1',
    });

    notificationContentService.build.mockReturnValue({
      title: 'Appointment confirmed',
      message: 'Your faculty appointment has been confirmed.',
    });

    emailDelivery.send.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(service.processNext()).resolves.toBe(true);

    expect(notificationJobsRepository.update).toHaveBeenLastCalledWith(
      'job-1',
      expect.objectContaining({
        status: NotificationJobStatus.PENDING,
        processedAt: null,
        availableAt: expect.any(Date),
      }),
    );

    expect(manager.create).toHaveBeenCalled();
  });

  it('marks a job failed when the recipient does not exist', async () => {
    const {
      service,
      notificationJobsRepository,
      usersRepository,
      queryBuilder,
    } = createService();

    const job = createJob();

    notificationJobsRepository.find.mockResolvedValue([]);
    setupClaimQuery(queryBuilder, job);

    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.processNext()).resolves.toBe(true);

    expect(notificationJobsRepository.update).toHaveBeenLastCalledWith(
      'job-1',
      {
        status: NotificationJobStatus.FAILED,
        processedAt: null,
      },
    );
  });

  it('marks an inactive recipient job as failed', async () => {
    const {
      service,
      notificationJobsRepository,
      usersRepository,
      queryBuilder,
    } = createService();

    const job = createJob();

    notificationJobsRepository.find.mockResolvedValue([]);
    setupClaimQuery(queryBuilder, job);

    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      isActive: false,
    });

    await expect(service.processNext()).resolves.toBe(true);

    expect(notificationJobsRepository.update).toHaveBeenLastCalledWith(
      'job-1',
      {
        status: NotificationJobStatus.FAILED,
        processedAt: null,
      },
    );
  });

  it('recovers stale processing jobs back to pending when attempts remain', async () => {
    const {
      service,
      notificationJobsRepository,
      queryBuilder,
    } = createService();

    const staleJob = createJob({
      status: NotificationJobStatus.PROCESSING,
      attempts: 1,
      updatedAt: new Date(Date.now() - 120_000),
    });

    notificationJobsRepository.find.mockResolvedValue([staleJob]);
    setupClaimQuery(queryBuilder, null);

    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    await expect(service.processNext()).resolves.toBe(false);

    expect(notificationJobsRepository.update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        status: NotificationJobStatus.PENDING,
        availableAt: expect.any(Date),
        processedAt: null,
      }),
    );
  });

  it('marks an exhausted stale processing job as failed', async () => {
    const {
      service,
      notificationJobsRepository,
      queryBuilder,
    } = createService();

    const staleJob = createJob({
      status: NotificationJobStatus.PROCESSING,
      attempts: 3,
      updatedAt: new Date(Date.now() - 120_000),
    });

    notificationJobsRepository.find.mockResolvedValue([staleJob]);
    setupClaimQuery(queryBuilder, null);

    notificationJobsRepository.update.mockResolvedValue({
      affected: 1,
    });

    await expect(service.processNext()).resolves.toBe(false);

    expect(notificationJobsRepository.update).toHaveBeenCalledWith(
      'job-1',
      {
        status: NotificationJobStatus.FAILED,
        processedAt: null,
      },
    );
  });
});
