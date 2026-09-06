import { z } from 'zod';

export const createAvailabilityScheduleSchema = z
  .object({
    facultyId: z.string().uuid(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    slotDuration: z.union([
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
    ]),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => data.startTime < data.endTime,
    {
      message: 'Start time must be earlier than end time',
      path: ['startTime'],
    },
  );

export type CreateAvailabilityScheduleDto = z.infer<
  typeof createAvailabilityScheduleSchema
>;

export const updateAvailabilityScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    slotDuration: z
      .union([
        z.literal(15),
        z.literal(30),
        z.literal(45),
        z.literal(60),
      ])
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.dayOfWeek !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined ||
      data.slotDuration !== undefined ||
      data.isActive !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export type UpdateAvailabilityScheduleDto = z.infer<
  typeof updateAvailabilityScheduleSchema
>;

export const availabilityDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must use YYYY-MM-DD format',
  )
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    },
    'Date must be a valid calendar date',
  );

export type AvailabilityDateDto = z.infer<
  typeof availabilityDateSchema
>;
