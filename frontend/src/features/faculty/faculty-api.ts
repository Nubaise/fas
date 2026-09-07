import { apiClient } from "@/lib/api/client"
import type { Department, Faculty } from "./faculty.types"

export type CreateFacultyRequest = {
  userId: string
  employeeNumber: string
  firstName: string
  lastName: string
  departmentId: string
}

export type UpdateFacultyRequest = {
  employeeNumber?: string
  firstName?: string
  lastName?: string
  departmentId?: string
}

export async function getFaculty(): Promise<Faculty[]> {
  return apiClient<Faculty[]>("/api/v1/faculty")
}

export async function getDepartments(): Promise<Department[]> {
  return apiClient<Department[]>("/api/v1/departments")
}

export type CreateDepartmentRequest = {
  name: string
  code: string
}

export type UpdateDepartmentRequest = {
  name?: string
  code?: string
}

export async function createDepartment(
  data: CreateDepartmentRequest,
): Promise<Department> {
  return apiClient<Department>("/api/v1/departments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function updateDepartment(
  id: string,
  data: UpdateDepartmentRequest,
): Promise<Department> {
  return apiClient<Department>(`/api/v1/departments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient<void>(`/api/v1/departments/${id}`, {
    method: "DELETE",
  })
}

export async function createFaculty(
  data: CreateFacultyRequest,
): Promise<Faculty> {
  return apiClient<Faculty>("/api/v1/faculty", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
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

export type OnboardFacultyRequest = {
  email: string
  password: string
  employeeNumber: string
  firstName: string
  lastName: string
  departmentId: string
}

export async function onboardFaculty(
  data: OnboardFacultyRequest,
): Promise<Faculty> {
  return apiClient<Faculty>("/api/v1/faculty/onboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export type BulkOnboardFacultyItem = OnboardFacultyRequest

export type BulkOnboardFacultyRequest = {
  faculty: BulkOnboardFacultyItem[]
}

export type BulkOnboardFacultyFailure = {
  row: number
  email: string
  employeeNumber: string
  message: string
}

export type BulkOnboardFacultyResponse = {
  successful: Faculty[]
  failed: BulkOnboardFacultyFailure[]
}

export async function bulkOnboardFaculty(
  data: BulkOnboardFacultyRequest,
): Promise<BulkOnboardFacultyResponse> {
  return apiClient<BulkOnboardFacultyResponse>(
    "/api/v1/faculty/bulk-onboard",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  )
}
