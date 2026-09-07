import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createAvailabilitySchedule,
  deleteAvailabilitySchedule,
  getFacultyAvailability,
  getFacultySchedules,
  updateAvailabilitySchedule,
  type CreateAvailabilityScheduleRequest,
  type UpdateAvailabilityScheduleRequest,
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

export function useCreateAvailabilityScheduleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAvailabilityScheduleRequest) =>
      createAvailabilitySchedule(data),

    onSuccess: (schedule) => {
      queryClient.invalidateQueries({
        queryKey: ["faculty", schedule.facultyId, "schedules"],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          schedule.facultyId,
          "availability",
        ],
      })
    },
  })
}

export function useUpdateAvailabilityScheduleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateAvailabilityScheduleRequest
    }) => updateAvailabilitySchedule(id, data),

    onSuccess: (schedule) => {
      queryClient.invalidateQueries({
        queryKey: ["faculty", schedule.facultyId, "schedules"],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          schedule.facultyId,
          "availability",
        ],
      })
    },
  })
}

export function useDeleteAvailabilityScheduleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string
      facultyId: string
    }) => deleteAvailabilitySchedule(id),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faculty", variables.facultyId, "schedules"],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          variables.facultyId,
          "availability",
        ],
      })
    },
  })
}
