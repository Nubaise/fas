import { z } from 'zod';

export const createAppointmentSchema = z
  .object({
    facultyId: z.string().uuid(),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    reason: z.string().trim().min(1).max(2000),
  })
  .refine(
    (data) =>
      new Date(data.startTime).getTime() <
      new Date(data.endTime).getTime(),
    {
      message: 'Start time must be earlier than end time',
      path: ['startTime'],
    },
  );

export type CreateAppointmentDto = z.infer<
  typeof createAppointmentSchema
>;
