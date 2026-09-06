import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
} from 'typeorm';

import { AppointmentEntity } from '../appointments/entities/appointment.entity.js';
import { EMAIL_DELIVERY } from '../email/email.module.js';
import type { EmailDelivery } from '../email/email-delivery.interface.js';
import type { EmailMessage } from '../email/email.types.js';
import {
  NotificationContentService,
  PermanentNotificationError,
} from '../notification-content/notification-content.service.js';
import { NotificationEntity } from '../notifications/entities/notification.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import {
  NotificationJobEntity,
  NotificationJobStatus,
} from './entities/notification-job.entity.js';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 5_000;
const PROCESSING_TIMEOUT_MS = 60_000;

@Injectable()
export class NotificationJobsService {
  private readonly logger = new Logger(
    NotificationJobsService.name,
  );

  constructor(
    @InjectRepository(NotificationJobEntity)
    private readonly notificationJobsRepository: Repository<NotificationJobEntity>,

    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,

    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepository: Repository<AppointmentEntity>,

    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    @Inject(EMAIL_DELIVERY)
    private readonly emailDelivery: EmailDelivery,

    private readonly notificationContentService: NotificationContentService,

    private readonly dataSource: DataSource,
  ) {}

  async processNext(): Promise<boolean> {
    await this.recoverStaleJobs();

    const job = await this.claimNextJob();

    if (!job) {
      return false;
    }

    try {
      await this.processJob(job);
      return true;
    } catch (error: unknown) {
      await this.handleFailure(job, error);
      return true;
    }
  }

  private async recoverStaleJobs(): Promise<void> {
    const staleBefore = new Date(
      Date.now() - PROCESSING_TIMEOUT_MS,
    );

    const staleJobs =
      await this.notificationJobsRepository.find({
        where: {
          status: NotificationJobStatus.PROCESSING,
        },
      });

    for (const job of staleJobs) {
      if (job.updatedAt > staleBefore) {
        continue;
      }

      if (job.attempts >= MAX_ATTEMPTS) {
        await this.notificationJobsRepository.update(
          job.id,
          {
            status: NotificationJobStatus.FAILED,
            processedAt: null,
          },
        );

        this.logger.error(
          `Stale notification job ${job.id} exhausted its attempts and was marked failed`,
        );

        continue;
      }

      await this.notificationJobsRepository.update(
        job.id,
        {
          status: NotificationJobStatus.PENDING,
          availableAt: new Date(),
          processedAt: null,
        },
      );

      this.logger.warn(
        `Recovered stale notification job ${job.id} and returned it to pending`,
      );
    }
  }

  private async claimNextJob(): Promise<NotificationJobEntity | null> {
    return this.dataSource.transaction(
      async (manager) => {
        const job = await manager
          .createQueryBuilder(
            NotificationJobEntity,
            'job',
          )
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .where('job.status = :status', {
            status: NotificationJobStatus.PENDING,
          })
          .andWhere('job.available_at <= :now', {
            now: new Date(),
          })
          .orderBy('job.available_at', 'ASC')
          .addOrderBy('job.created_at', 'ASC')
          .getOne();

        if (!job) {
          return null;
        }

        job.status = NotificationJobStatus.PROCESSING;
        job.attempts += 1;

        return manager.save(
          NotificationJobEntity,
          job,
        );
      },
    );
  }

  private async processJob(
    job: NotificationJobEntity,
  ): Promise<void> {
    const recipient = await this.usersRepository.findOne({
      where: {
        id: job.recipientId,
      },
    });

    if (!recipient) {
      throw new PermanentNotificationError(
        'Notification recipient does not exist',
      );
    }

    if (!recipient.isActive) {
      throw new PermanentNotificationError(
        'Notification recipient is inactive',
      );
    }

    const appointmentId =
      typeof job.payload.appointmentId === 'string'
        ? job.payload.appointmentId
        : undefined;

    if (!appointmentId) {
      throw new PermanentNotificationError(
        'Notification job is missing appointmentId',
      );
    }

    const appointment =
      await this.appointmentsRepository.findOne({
        where: {
          id: appointmentId,
        },
      });

    if (!appointment) {
      throw new PermanentNotificationError(
        'Notification appointment does not exist',
      );
    }

    const content =
      this.notificationContentService.build(job);

    const email: EmailMessage = {
      to: recipient.email,
      subject: content.title,
      text: content.message,
      idempotencyKey: job.id,
    };

    await this.createNotification(job, content);

    await this.emailDelivery.send(email);

    await this.notificationJobsRepository.update(
      job.id,
      {
        status: NotificationJobStatus.COMPLETED,
        processedAt: new Date(),
      },
    );

    this.logger.log(
      `Notification job ${job.id} completed`,
    );
  }

  private async createNotification(
    job: NotificationJobEntity,
    content: {
      title: string;
      message: string;
    },
  ): Promise<void> {
    await this.dataSource.transaction(
      async (manager) => {
        const notification =
          manager.create(NotificationEntity, {
            userId: job.recipientId,
            type: job.type,
            title: content.title,
            message: content.message,
            readAt: null,
          });

        await manager.save(
          NotificationEntity,
          notification,
        );
      },
    );
  }

  private async handleFailure(
    job: NotificationJobEntity,
    error: unknown,
  ): Promise<void> {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown notification error';

    if (
      error instanceof PermanentNotificationError ||
      job.attempts >= MAX_ATTEMPTS
    ) {
      await this.notificationJobsRepository.update(
        job.id,
        {
          status: NotificationJobStatus.FAILED,
          processedAt: null,
        },
      );

      this.logger.error(
        `Notification job ${job.id} failed permanently: ${message}`,
      );

      return;
    }

    const backoffMs =
      BASE_BACKOFF_MS *
      2 ** (job.attempts - 1);

    const availableAt = new Date(
      Date.now() + backoffMs,
    );

    await this.notificationJobsRepository.update(
      job.id,
      {
        status: NotificationJobStatus.PENDING,
        availableAt,
        processedAt: null,
      },
    );

    this.logger.warn(
      `Notification job ${job.id} failed; retry scheduled for ${availableAt.toISOString()}: ${message}`,
    );
  }
}
