import { useMemo } from "react"
import { useAppointmentsQuery } from "@/features/appointments/appointment-queries"
import {
  useDepartmentsQuery,
  useFacultyQuery,
} from "@/features/faculty/faculty-queries"

export function useAdminDashboardStats() {
  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()
  const appointmentsQuery = useAppointmentsQuery()

  const stats = useMemo(() => {
    const appointments = appointmentsQuery.data ?? []

    return {
      facultyCount: facultyQuery.data?.length ?? 0,
      departmentCount: departmentsQuery.data?.length ?? 0,
      appointmentCount: appointments.length,
      pendingAppointmentCount: appointments.filter(
        (appointment) => appointment.status === "PENDING",
      ).length,
    }
  }, [
    facultyQuery.data,
    departmentsQuery.data,
    appointmentsQuery.data,
  ])

  return {
    stats,
    facultyQuery,
    departmentsQuery,
    appointmentsQuery,
    isLoading:
      facultyQuery.isLoading ||
      departmentsQuery.isLoading ||
      appointmentsQuery.isLoading,
    isError:
      facultyQuery.isError ||
      departmentsQuery.isError ||
      appointmentsQuery.isError,
  }
}
