import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  XCircle,
} from "lucide-react"
import { useMemo, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { routes } from "@/routes/routes"
import { useAppointmentsQuery } from "./appointment-queries"
import type { Appointment } from "./appointment.types"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
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
      return CheckCircle2
    case "REJECTED":
    case "CANCELLED":
      return XCircle
    case "PENDING":
      return Clock3
    case "COMPLETED":
      return CheckCircle2
  }
}

function statusLabel(status: Appointment["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function AppointmentRow({
  appointment,
  muted = false,
  onClick,
}: {
  appointment: Appointment
  muted?: boolean
  onClick: () => void
}) {
  const StatusIcon = statusIcon(appointment.status)

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full flex-col gap-4 border-b p-4 text-left last:border-b-0",
        "transition-[background-color,border-color] duration-150 ease-out",
        "hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "active:bg-muted/60",
        muted ? "opacity-90" : "",
        "sm:flex-row sm:items-center sm:p-5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 sm:contents">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <CalendarDays
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1 sm:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                {formatDate(appointment.startTime)}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {formatTime(appointment.startTime)} -{" "}
                {formatTime(appointment.endTime)}
              </p>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                appointment.status,
              )}`}
            >
              <StatusIcon className="size-3" aria-hidden="true" />
              {statusLabel(appointment.status)}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {appointment.reason}
          </p>
        </div>
      </div>

      <div className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:flex">
        <CalendarDays
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <div className="hidden min-w-0 flex-1 sm:block">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-medium">
            {formatDate(appointment.startTime)}
          </p>

          <span className="text-sm text-muted-foreground">
            {formatTime(appointment.startTime)} -{" "}
            {formatTime(appointment.endTime)}
          </span>
        </div>

        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {appointment.reason}
        </p>
      </div>

      <span
        className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusClass(
          appointment.status,
        )}`}
      >
        <StatusIcon className="size-3" aria-hidden="true" />
        {statusLabel(appointment.status)}
      </span>

      <ChevronRight
        className="hidden size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-foreground sm:block"
        aria-hidden="true"
      />

      <div className="flex items-center justify-end border-t pt-3 sm:hidden">
        <span className="text-xs font-medium text-primary">
          View appointment
        </span>

        <ArrowRight
          className="ml-1.5 size-3.5 text-primary transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </button>
  )
}

function EmptySection({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>

      <p className="mt-3 text-sm font-medium">{title}</p>

      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function StudentAppointmentsPage() {
  const navigate = useNavigate()
  const query = useAppointmentsQuery()

  const appointments = query.data ?? []

  const { upcoming, history } = useMemo(() => {
    const now = Date.now()

    const upcomingAppointments = appointments
      .filter(
        (appointment) =>
          new Date(appointment.endTime).getTime() >= now &&
          appointment.status !== "CANCELLED" &&
          appointment.status !== "REJECTED",
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime(),
      )

    const historyAppointments = appointments
      .filter(
        (appointment) =>
          new Date(appointment.endTime).getTime() < now ||
          appointment.status === "CANCELLED" ||
          appointment.status === "REJECTED",
      )
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() -
          new Date(a.startTime).getTime(),
      )

    return {
      upcoming: upcomingAppointments,
      history: historyAppointments,
    }
  }, [appointments])

  if (query.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <LoadingState />
      </main>
    )
  }

  if (query.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <ErrorState onRetry={() => query.refetch()} />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:gap-10">
      <section className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Student portal
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My appointments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Keep track of your upcoming appointments and past requests.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => navigate(`${routes.student}/faculty`)}
          className="w-full sm:w-auto"
        >
          Book appointment
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </section>

      {appointments.length === 0 ? (
        <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            No appointments yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Browse faculty to find an available appointment slot and send
            your first request.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() => navigate(`${routes.student}/faculty`)}
          >
            Browse faculty
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </section>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Upcoming
                </h2>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Your scheduled and pending appointments.
                </p>
              </div>

              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {upcoming.length}
              </span>
            </div>

            {upcoming.length === 0 ? (
              <EmptySection
                icon={
                  <Clock3
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                title="Nothing upcoming"
                description="You don't have any upcoming appointments right now."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border bg-card">
                {upcoming.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() =>
                      navigate(
                        `${routes.student}/appointments/${appointment.id}`,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <History
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <h2 className="text-lg font-semibold tracking-tight">
                    History
                  </h2>
                </div>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Completed and previous appointment requests.
                </p>
              </div>

              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {history.length}
              </span>
            </div>

            {history.length === 0 ? (
              <EmptySection
                icon={
                  <History
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                title="No history yet"
                description="Completed and previous appointment activity will appear here."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border bg-card">
                {history.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    muted
                    onClick={() =>
                      navigate(
                        `${routes.student}/appointments/${appointment.id}`,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
