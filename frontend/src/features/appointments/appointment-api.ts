import { apiClient } from "@/lib/api/client"
import type {
  Appointment,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
} from "./appointment.types"

export async function createAppointment(
  data: CreateAppointmentRequest,
): Promise<Appointment> {
  return apiClient<Appointment>("/api/v1/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function getAppointments(): Promise<Appointment[]> {
  return apiClient<Appointment[]>("/api/v1/appointments")
}

export async function getAppointment(id: string): Promise<Appointment> {
  return apiClient<Appointment>(`/api/v1/appointments/${id}`)
}

export async function acceptAppointment(
  id: string,
): Promise<Appointment> {
  return apiClient<Appointment>(
    `/api/v1/appointments/${id}/accept`,
    {
      method: "POST",
    },
  )
}

export async function rejectAppointment(
  id: string,
): Promise<Appointment> {
  return apiClient<Appointment>(
    `/api/v1/appointments/${id}/reject`,
    {
      method: "POST",
    },
  )
}

export async function cancelAppointment(
  id: string,
): Promise<Appointment> {
  return apiClient<Appointment>(
    `/api/v1/appointments/${id}/cancel`,
    {
      method: "POST",
    },
  )
}

export async function completeAppointment(
  id: string,
): Promise<Appointment> {
  return apiClient<Appointment>(
    `/api/v1/appointments/${id}/complete`,
    {
      method: "POST",
    },
  )
}

export async function rescheduleAppointment(
  id: string,
  data: RescheduleAppointmentRequest,
): Promise<Appointment> {
  return apiClient<Appointment>(
    `/api/v1/appointments/${id}/reschedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  )
}
