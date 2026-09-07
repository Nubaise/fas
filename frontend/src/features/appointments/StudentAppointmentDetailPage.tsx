import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { routes } from "@/routes/routes"
import { useAppointmentQuery } from "./appointment-queries"
import type { Appointment } from "./appointment.types"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "long",
    month: "long",
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
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    ),
  )

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
}

function statusClass(status: Appointment["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    case "PENDING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
    case "COMPLETED":
      return "border-border bg-muted text-muted-foreground"
  }
}

function statusIcon(status: Appointment["status"]) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return CheckCircle2
    case "REJECTED":
    case "CANCELLED":
      return XCircle
    case "PENDING":
      return Clock3
  }
}

function statusLabel(status: Appointment["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 font-medium">{children}</div>
      </div>
    </div>
  )
}

export function StudentAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()

  const query = useAppointmentQuery(appointmentId ?? "")

  if (query.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <LoadingState />
      </main>
    )
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <ErrorState
          message="This appointment could not be loaded."
          onRetry={() => query.refetch()}
        />
      </main>
    )
  }

  const appointment = query.data
  const StatusIcon = statusIcon(appointment.status)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:gap-8 sm:p-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-2"
        onClick={() => navigate(`${routes.student}/appointments`)}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        My appointments
      </Button>

      <section className="space-y-3">
        <p className="text-sm font-medium text-primary">Appointment</p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Appointment details
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review the current status, schedule, and reason for your
              appointment request.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${statusClass(
                appointment.status,
              )}`}
            >
              <StatusIcon className="size-5" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current status
              </p>

              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                  appointment.status,
                )}`}
              >
                <StatusIcon className="size-3" aria-hidden="true" />
                {statusLabel(appointment.status)}
              </span>
            </div>
          </div>

          <div className="border-t pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Appointment ID
            </p>

            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {appointment.id}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-5 sm:px-7">
          <h2 className="font-semibold tracking-tight">Schedule</h2>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            The date and time associated with this appointment.
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-3 sm:p-7">
          <DetailItem
            icon={
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            }
            label="Date"
          >
            {formatDate(appointment.startTime)}
          </DetailItem>

          <DetailItem
            icon={
              <Clock3
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            }
            label="Time"
          >
            {formatTime(appointment.startTime)} -{" "}
            {formatTime(appointment.endTime)}
          </DetailItem>

          <DetailItem
            icon={
              <Clock3
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            }
            label="Duration"
          >
            {formatDuration(
              appointment.startTime,
              appointment.endTime,
            )}
          </DetailItem>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-5 sm:px-7">
          <FileText
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <h2 className="font-semibold tracking-tight">
              Reason for appointment
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              The reason provided when the appointment was requested.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="rounded-xl bg-muted/40 px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-6">
              {appointment.reason}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-5 sm:px-7">
          <h2 className="font-semibold tracking-tight">Record details</h2>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            System information associated with this appointment.
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Faculty
            </p>

            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {appointment.facultyId}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Student
            </p>

            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {appointment.studentId}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Created
            </p>

            <p className="mt-1 text-sm">
              {formatDate(appointment.createdAt)} ·{" "}
              {formatTime(appointment.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last updated
            </p>

            <p className="mt-1 text-sm">
              {formatDate(appointment.updatedAt)} ·{" "}
              {formatTime(appointment.updatedAt)}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
