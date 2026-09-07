import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createAppointment,
  getAppointment,
  getAppointments,
} from "./appointment-api"
import type { CreateAppointmentRequest } from "./appointment.types"

export function useAppointmentsQuery() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  })
}

export function useAppointmentQuery(id: string) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: () => getAppointment(id),
    enabled: Boolean(id),
  })
}

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) => createAppointment(data),
    onSuccess: (appointment) => {
      queryClient.setQueryData(
        ["appointments", appointment.id],
        appointment,
      )
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      })
    },
  })
}
