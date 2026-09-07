import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
} from "lucide-react"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { useAppointmentsQuery } from "./appointment-queries"
import type { Appointment, AppointmentStatus } from "./appointment.types"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "long",
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

function statusClass(status: AppointmentStatus) {
  switch (status) {
    case "PENDING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
    case "CONFIRMED":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    case "COMPLETED":
      return "border-border bg-muted text-muted-foreground"
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

function sortByStartTime(appointments: Appointment[]) {
  return [...appointments].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime(),
  )
}

function sortByMostRecent(appointments: Appointment[]) {
  return [...appointments].sort(
    (a, b) =>
      new Date(b.startTime).getTime() -
      new Date(a.startTime).getTime(),
  )
}

function AppointmentRow({
  appointment,
  onSelect,
}: {
  appointment: Appointment
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(appointment.id)}
      className="group flex w-full items-start gap-4 border-b p-4 text-left last:border-b-0 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <CalendarDays
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-medium">
            {formatDate(appointment.startTime)}
          </p>

          <span className="text-sm text-muted-foreground">
            {formatTime(appointment.startTime)} –{" "}
            {formatTime(appointment.endTime)}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {appointment.reason}
        </p>
      </div>

      <span
        className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusClass(
          appointment.status,
        )}`}
      >
        {statusLabel(appointment.status)}
      </span>

      <ChevronRight
        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  )
}

function AppointmentSection({
  title,
  description,
  appointments,
  onSelect,
  icon,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  description: string
  appointments: Appointment[]
  onSelect: (id: string) => void
  icon: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <span className="text-sm tabular-nums text-muted-foreground">
          {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>

          <p className="mt-3 text-sm font-medium">
            {emptyTitle ?? "Nothing here"}
          </p>

          {emptyDescription ? (
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {emptyDescription}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {appointments.map((appointment) => (
            <AppointmentRow
              key={appointment.id}
              appointment={appointment}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function FacultyAppointmentsPage() {
  const navigate = useNavigate()
  const query = useAppointmentsQuery()

  const appointments = query.data ?? []

  const groupedAppointments = useMemo(() => {
    const now = Date.now()

    const pending = appointments.filter(
      (appointment) => appointment.status === "PENDING",
    )

    const confirmed = sortByStartTime(
      appointments.filter(
        (appointment) =>
          appointment.status === "CONFIRMED" &&
          new Date(appointment.endTime).getTime() >= now,
      ),
    )

    const history = sortByMostRecent(
      appointments.filter(
        (appointment) =>
          appointment.status === "COMPLETED" ||
          appointment.status === "REJECTED" ||
          appointment.status === "CANCELLED" ||
          (appointment.status === "CONFIRMED" &&
            new Date(appointment.endTime).getTime() < now),
      ),
    )

    return {
      pending,
      confirmed,
      history,
    }
  }, [appointments])

  const navigateToAppointment = (id: string) => {
    navigate(`/faculty/appointments/${id}`)
  }

  if (query.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (query.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <ErrorState
          message="Unable to load your appointments."
          onRetry={() => query.refetch()}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Faculty portal
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Appointments
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Review incoming requests, keep track of confirmed
            appointments, and review your appointment history.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
          <span>{appointments.length} total</span>
        </div>
      </section>

      {appointments.length === 0 ? (
        <section className="rounded-2xl border border-dashed p-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-4 font-semibold">
            No appointments yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Student appointment requests will appear here when
            they are submitted.
          </p>
        </section>
      ) : (
        <div className="space-y-10">
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Inbox className="size-5" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Needs your attention
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {groupedAppointments.pending.length}{" "}
                    {groupedAppointments.pending.length === 1
                      ? "pending request"
                      : "pending requests"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Review requests and respond from the appointment
                    detail page.
                  </p>
                </div>
              </div>

              {groupedAppointments.pending.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigateToAppointment(
                      groupedAppointments.pending[0].id,
                    )
                  }
                >
                  Review request
                  <ChevronRight className="size-4" />
                </Button>
              ) : null}
            </div>
          </section>

          <AppointmentSection
            title="Pending requests"
            description="Requests waiting for your response."
            appointments={groupedAppointments.pending}
            onSelect={navigateToAppointment}
            icon={
              <Inbox
                className="size-4 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            }
            emptyTitle="No pending requests"
            emptyDescription="You're all caught up."
          />

          <AppointmentSection
            title="Upcoming confirmed"
            description="Your confirmed appointments that are still ahead."
            appointments={groupedAppointments.confirmed}
            onSelect={navigateToAppointment}
            icon={
              <CheckCircle2
                className="size-4 text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
            }
            emptyTitle="No upcoming appointments"
            emptyDescription="Confirmed appointments will appear here."
          />

          <AppointmentSection
            title="History"
            description="Completed, cancelled, rejected, and past appointments."
            appointments={groupedAppointments.history}
            onSelect={navigateToAppointment}
            icon={
              <Clock3
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            }
            emptyTitle="No appointment history"
            emptyDescription="Past appointment activity will appear here."
          />
        </div>
      )}
    </main>
  )
}
