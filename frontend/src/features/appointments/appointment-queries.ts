import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  acceptAppointment,
  cancelAppointment,
  completeAppointment,
  createAppointment,
  getAppointment,
  getAppointments,
  rejectAppointment,
  rescheduleAppointment,
} from "./appointment-api"

import type {
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
} from "./appointment.types"

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

export function useAcceptAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => acceptAppointment(id),
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

export function useRejectAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rejectAppointment(id),
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

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
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

export function useCompleteAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => completeAppointment(id),
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

export function useRescheduleAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: RescheduleAppointmentRequest
    }) => rescheduleAppointment(id, data),

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
