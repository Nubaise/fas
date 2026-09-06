import { Injectable } from '@nestjs/common';

import { NotificationJobEntity } from '../notification-jobs/entities/notification-job.entity.js';

export type NotificationContent = {
  title: string;
  message: string;
};

type NotificationPayload = {
  appointmentId?: string;
};

@Injectable()
export class NotificationContentService {
  build(job: NotificationJobEntity): NotificationContent {
    const payload = job.payload as NotificationPayload;

    if (!payload.appointmentId) {
      throw new PermanentNotificationError(
        'Notification job is missing appointmentId',
      );
    }

    switch (job.type) {
      case 'APPOINTMENT_REQUESTED':
        return {
          title: 'New appointment request',
          message:
            'You have received a new faculty appointment request.',
        };

      case 'APPOINTMENT_CONFIRMED':
        return {
          title: 'Appointment confirmed',
          message:
            'Your faculty appointment has been confirmed.',
        };

      case 'APPOINTMENT_REJECTED':
        return {
          title: 'Appointment rejected',
          message:
            'Your faculty appointment request has been rejected.',
        };

      case 'APPOINTMENT_CANCELLED':
        return {
          title: 'Appointment cancelled',
          message:
            'Your faculty appointment has been cancelled.',
        };

      case 'APPOINTMENT_RESCHEDULED':
        return {
          title: 'Appointment rescheduled',
          message:
            'Your faculty appointment has been rescheduled.',
        };

      case 'APPOINTMENT_COMPLETED':
        return {
          title: 'Appointment completed',
          message:
            'Your faculty appointment has been completed.',
        };

      default:
        throw new PermanentNotificationError(
          `Unsupported notification type: ${job.type}`,
        );
    }
  }
}

export class PermanentNotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentNotificationError';
  }
}
