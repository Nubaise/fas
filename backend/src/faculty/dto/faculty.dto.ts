import { z } from 'zod';

export const createFacultySchema = z.object({
  userId: z.string().uuid(),
  employeeNumber: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  departmentId: z.string().uuid(),
});

export type CreateFacultyDto = z.infer<typeof createFacultySchema>;

export const updateFacultySchema = z
  .object({
    employeeNumber: z.string().trim().min(1).optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    departmentId: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      data.employeeNumber !== undefined ||
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.departmentId !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export type UpdateFacultyDto = z.infer<typeof updateFacultySchema>;
