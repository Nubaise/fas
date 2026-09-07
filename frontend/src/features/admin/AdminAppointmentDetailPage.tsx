import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import {
  useAppointmentQuery,
} from "@/features/appointments/appointment-queries"
import type { AppointmentStatus } from "@/features/appointments/appointment.types"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "full",
    timeStyle: "short",
  })
}

function statusClass(status: AppointmentStatus) {
  switch (status) {
    case "CONFIRMED":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    case "COMPLETED":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "PENDING":
    default:
      return "border-border bg-muted/50 text-muted-foreground"
  }
}

function statusLabel(status: AppointmentStatus) {
  switch (status) {
    case "PENDING":
      return "Pending"
    case "CONFIRMED":
      return "Confirmed"
    case "REJECTED":
      return "Rejected"
    case "CANCELLED":
      return "Cancelled"
    case "COMPLETED":
      return "Completed"
  }
}

function formatDuration(start: string, end: string) {
  const minutes = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) /
      60000,
  )

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`
  }

  return `${hours}h ${remainingMinutes}m`
}

export function AdminAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const query = useAppointmentQuery(appointmentId ?? "")

  if (query.isPending) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <ErrorState
          message="Unable to load this appointment."
          onRetry={() => query.refetch()}
        />
      </main>
    )
  }

  const appointment = query.data

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <Button
        variant="ghost"
        className="w-fit gap-2"
        onClick={() => navigate("/admin/appointments")}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Appointments
      </Button>

      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Admin Portal
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Appointment details
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review the complete appointment record.
        </p>
      </section>

      <section className="space-y-7 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">
            Status
          </p>

          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusClass(
              appointment.status,
            )}`}
          >
            {statusLabel(appointment.status)}
          </span>
        </div>

        <div className="flex gap-3">
          <CalendarDays
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm text-muted-foreground">
              Start
            </p>
            <p className="mt-1 font-medium">
              {formatDateTime(appointment.startTime)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Clock3
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm text-muted-foreground">
              End
            </p>
            <p className="mt-1 font-medium">
              {formatDateTime(appointment.endTime)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Duration:{" "}
              {formatDuration(
                appointment.startTime,
                appointment.endTime,
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <UserRound
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Student
              </p>
              <p className="mt-1 break-all font-mono text-sm">
                {appointment.studentId}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Faculty
              </p>
              <p className="mt-1 break-all font-mono text-sm">
                {appointment.facultyId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <FileText
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Reason for appointment
            </p>
            <p className="mt-1 whitespace-pre-wrap">
              {appointment.reason}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Appointment ID
          </p>
          <p className="mt-1 break-all font-mono text-xs">
            {appointment.id}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Created
          </p>
          <p className="mt-1 text-sm">
            {formatDateTime(appointment.createdAt)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Last updated
          </p>
          <p className="mt-1 text-sm">
            {formatDateTime(appointment.updatedAt)}
          </p>
        </div>
      </section>
    </main>
  )
}
