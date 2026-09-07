import { apiClient } from "@/lib/api/client"
import type { Department, Faculty } from "./faculty.types"

export type UpdateFacultyRequest = {
  firstName?: string
  lastName?: string
}

export async function getFaculty(): Promise<Faculty[]> {
  return apiClient<Faculty[]>("/api/v1/faculty")
}

export async function getDepartments(): Promise<Department[]> {
  return apiClient<Department[]>("/api/v1/departments")
}

export async function updateFaculty(
  id: string,
  data: UpdateFacultyRequest,
): Promise<Faculty> {
  return apiClient<Faculty>(`/api/v1/faculty/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}
