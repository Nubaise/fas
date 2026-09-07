import { useQuery } from "@tanstack/react-query"
import {
  getFacultyAvailability,
  getFacultySchedules,
} from "./availability-api"

export function useFacultySchedulesQuery(facultyId: string) {
  return useQuery({
    queryKey: ["faculty", facultyId, "schedules"],
    queryFn: () => getFacultySchedules(facultyId),
    enabled: Boolean(facultyId),
  })
}

export function useFacultyAvailabilityQuery(
  facultyId: string,
  date: string,
) {
  return useQuery({
    queryKey: ["faculty", facultyId, "availability", date],
    queryFn: () => getFacultyAvailability(facultyId, date),
    enabled: Boolean(facultyId && date),
  })
}
