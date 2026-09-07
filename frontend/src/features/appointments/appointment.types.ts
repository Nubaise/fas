export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"

export type Appointment = {
  id: string
  studentId: string
  facultyId: string
  startTime: string
  endTime: string
  reason: string
  status: AppointmentStatus
  createdAt: string
  updatedAt: string
}

export type CreateAppointmentRequest = {
  facultyId: string
  startTime: string
  endTime: string
  reason: string
}
