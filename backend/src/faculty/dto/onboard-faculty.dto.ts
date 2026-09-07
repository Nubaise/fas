import { z } from 'zod';

export const onboardFacultySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  employeeNumber: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  departmentId: z.string().uuid(),
});

export type OnboardFacultyDto = z.infer<
  typeof onboardFacultySchema
>;
