import { apiClient } from "@/lib/api/client"
import type { Department, Faculty } from "./faculty.types"

export async function getFaculty(): Promise<Faculty[]> {
  return apiClient<Faculty[]>("/api/v1/faculty")
}

export async function getDepartments(): Promise<Department[]> {
  return apiClient<Department[]>("/api/v1/departments")
}
