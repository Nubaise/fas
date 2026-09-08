export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"

export type AppointmentParticipant = {
  firstName: string
  lastName: string
  studentNumber?: string
  employeeNumber?: string
}

export type Appointment = {
  id: string
  studentId: string
  student?: AppointmentParticipant
  facultyId: string
  faculty?: AppointmentParticipant
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

export type RescheduleAppointmentRequest = {
  startTime: string
  endTime: string
}
