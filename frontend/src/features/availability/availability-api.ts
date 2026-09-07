import { apiClient } from "@/lib/api/client"
import type {
  AvailabilitySchedule,
  AvailabilitySlot,
} from "./availability.types"

export type CreateAvailabilityScheduleRequest = {
  facultyId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: 15 | 30 | 45 | 60
  isActive?: boolean
}

export type UpdateAvailabilityScheduleRequest = {
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  slotDuration?: 15 | 30 | 45 | 60
  isActive?: boolean
}

export async function getFacultySchedules(
  facultyId: string,
): Promise<AvailabilitySchedule[]> {
  return apiClient<AvailabilitySchedule[]>(
    `/api/v1/availability-schedules/faculty/${facultyId}`,
  )
}

export async function getFacultyAvailability(
  facultyId: string,
  date: string,
): Promise<AvailabilitySlot[]> {
  return apiClient<AvailabilitySlot[]>(
    `/api/v1/availability-schedules/faculty/${facultyId}/availability?date=${date}`,
  )
}

export async function createAvailabilitySchedule(
  data: CreateAvailabilityScheduleRequest,
): Promise<AvailabilitySchedule> {
  return apiClient<AvailabilitySchedule>(
    "/api/v1/availability-schedules",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  )
}

export async function updateAvailabilitySchedule(
  id: string,
  data: UpdateAvailabilityScheduleRequest,
): Promise<AvailabilitySchedule> {
  return apiClient<AvailabilitySchedule>(
    `/api/v1/availability-schedules/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  )
}

export async function deleteAvailabilitySchedule(
  id: string,
): Promise<void> {
  return apiClient<void>(
    `/api/v1/availability-schedules/${id}`,
    {
      method: "DELETE",
    },
  )
}
