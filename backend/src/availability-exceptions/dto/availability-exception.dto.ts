import { z } from 'zod';

export const createAvailabilityExceptionSchema = z
  .object({
    facultyId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .nullable()
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .nullable()
      .optional(),
    reason: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      (data.startTime == null && data.endTime == null) ||
      (data.startTime != null &&
        data.endTime != null &&
        data.startTime < data.endTime),
    {
      message:
        'Provide both start and end times for a partial exception, with start earlier than end',
      path: ['startTime'],
    },
  );

export type CreateAvailabilityExceptionDto = z.infer<
  typeof createAvailabilityExceptionSchema
>;

export const updateAvailabilityExceptionSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .nullable()
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .nullable()
      .optional(),
    reason: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.date !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined ||
      data.reason !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export type UpdateAvailabilityExceptionDto = z.infer<
  typeof updateAvailabilityExceptionSchema
>;
