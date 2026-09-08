import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { useAppointmentQuery } from "@/features/appointments/appointment-queries"
import type { AppointmentStatus } from "@/features/appointments/appointment.types"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "full",
    timeStyle: "short",
  })
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
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

function participantName(
  participant?: {
    firstName: string
    lastName: string
  },
  fallbackId?: string,
) {
  const name = [participant?.firstName, participant?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim()

  return name || fallbackId || "Unknown"
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

function statusClass(status: AppointmentStatus) {
  switch (status) {
    case "CONFIRMED":
      return "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/25 bg-destructive/10 text-destructive"
    case "COMPLETED":
      return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "PENDING":
    default:
      return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
  }
}

function statusIcon(status: AppointmentStatus) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return CheckCircle2
    case "PENDING":
      return Clock3
    case "REJECTED":
    case "CANCELLED":
      return Clock3
  }
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1.5 break-all text-sm ${
          mono ? "font-mono text-xs" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export function AdminAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()

  const query = useAppointmentQuery(appointmentId ?? "")

  if (query.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2"
          onClick={() => navigate("/admin/appointments")}
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />
          Appointments
        </Button>

        <ErrorState
          message="Unable to load this appointment. The appointment record could not be found or retrieved."
          onRetry={() => {
            void query.refetch()
          }}
        />
      </main>
    )
  }

  const appointment = query.data
  const StatusIcon = statusIcon(appointment.status)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <Button
        type="button"
        variant="ghost"
        className="-ml-2 w-fit gap-2"
        onClick={() => navigate("/admin/appointments")}
      >
        <ArrowLeft
          className="size-4"
          aria-hidden="true"
        />
        Appointments
      </Button>

      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Appointment details
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Review the authoritative record for this appointment.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusClass(
            appointment.status,
          )}`}
        >
          <StatusIcon
            className="size-4"
            aria-hidden="true"
          />
          {statusLabel(appointment.status)}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/15 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium">
                Appointment time
              </p>

              <p className="text-xs text-muted-foreground">
                Scheduled meeting window
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 sm:grid-cols-3">
          <div className="border-b p-5 sm:border-r sm:border-b-0 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </p>

            <p className="mt-2 font-medium">
              {formatShortDate(appointment.startTime)}
            </p>
          </div>

          <div className="border-b p-5 sm:border-r sm:border-b-0 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Time
            </p>

            <p className="mt-2 font-medium">
              {formatTime(appointment.startTime)} –{" "}
              {formatTime(appointment.endTime)}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Duration
            </p>

            <p className="mt-2 font-medium">
              {formatDuration(
                appointment.startTime,
                appointment.endTime,
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
              <UserRound
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium">
                Participants
              </p>

              <p className="text-xs text-muted-foreground">
                Appointment participants
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <InfoItem
                label="Student"
                value={participantName(
                  appointment.student,
                  appointment.studentId,
                )}
              />
              {appointment.student?.studentNumber ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {appointment.student.studentNumber}
                </p>
              ) : null}
            </div>

            <div>
              <InfoItem
                label="Faculty"
                value={participantName(
                  appointment.faculty,
                  appointment.facultyId,
                )}
              />
              {appointment.faculty?.employeeNumber ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {appointment.faculty.employeeNumber}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
              <Clock3
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium">
                Schedule
              </p>

              <p className="text-xs text-muted-foreground">
                Exact appointment timestamps
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            <InfoItem
              label="Starts"
              value={formatDateTime(appointment.startTime)}
            />

            <InfoItem
              label="Ends"
              value={formatDateTime(appointment.endTime)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
          <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
            <FileText
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-medium">
              Appointment reason
            </p>

            <p className="text-xs text-muted-foreground">
              Reason provided when the appointment was created
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="whitespace-pre-wrap text-sm leading-7">
            {appointment.reason}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4 sm:px-6">
          <p className="text-sm font-medium">
            Record information
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            System-generated appointment metadata
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
          <InfoItem
            label="Appointment ID"
            value={appointment.id}
            mono
          />

          <InfoItem
            label="Created"
            value={formatDateTime(appointment.createdAt)}
          />

          <InfoItem
            label="Last updated"
            value={formatDateTime(appointment.updatedAt)}
          />
        </div>
      </section>
    </main>
  )
}
