import { z } from 'zod';

export const bulkOnboardFacultyItemSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  employeeNumber: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  departmentId: z.string().uuid(),
});

export const bulkOnboardFacultySchema = z.object({
  faculty: z.array(bulkOnboardFacultyItemSchema).min(1),
});

export type BulkOnboardFacultyItemDto = z.infer<
  typeof bulkOnboardFacultyItemSchema
>;

export type BulkOnboardFacultyDto = z.infer<
  typeof bulkOnboardFacultySchema
>;
