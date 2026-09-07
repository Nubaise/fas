import { apiClient } from "@/lib/api/client"
import type {
  Appointment,
  CreateAppointmentRequest,
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
