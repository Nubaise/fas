import { apiClient } from "@/lib/api/client"

export type AvailabilityException = {
  id: string
  facultyId: string
  date: string
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export type CreateAvailabilityExceptionRequest = {
  facultyId: string
  date: string
  startTime?: string | null
  endTime?: string | null
  reason?: string | null
}

export type UpdateAvailabilityExceptionRequest = {
  date?: string
  startTime?: string | null
  endTime?: string | null
  reason?: string | null
}

export async function getFacultyExceptions(
  facultyId: string,
): Promise<AvailabilityException[]> {
  return apiClient<AvailabilityException[]>(
    `/api/v1/availability-exceptions/faculty/${facultyId}`,
  )
}

export async function createAvailabilityException(
  data: CreateAvailabilityExceptionRequest,
): Promise<AvailabilityException> {
  return apiClient<AvailabilityException>(
    "/api/v1/availability-exceptions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  )
}

export async function updateAvailabilityException(
  id: string,
  data: UpdateAvailabilityExceptionRequest,
): Promise<AvailabilityException> {
  return apiClient<AvailabilityException>(
    `/api/v1/availability-exceptions/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  )
}

export async function deleteAvailabilityException(
  id: string,
): Promise<void> {
  return apiClient<void>(
    `/api/v1/availability-exceptions/${id}`,
    {
      method: "DELETE",
    },
  )
}
