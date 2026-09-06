import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.name !== undefined || data.code !== undefined, {
    message: 'At least one field must be provided',
  });

export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
