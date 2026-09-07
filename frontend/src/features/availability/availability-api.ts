import { apiClient } from "@/lib/api/client"
import type {
  AvailabilitySchedule,
  AvailabilitySlot,
} from "./availability.types"

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
