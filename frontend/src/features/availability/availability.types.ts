export type AvailabilitySlot = {
  date: string
  startTime: string
  endTime: string
}

export type AvailabilitySchedule = {
  id: string
  facultyId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  isActive: boolean
}
