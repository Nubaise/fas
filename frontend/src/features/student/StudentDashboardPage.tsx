import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Search,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { useAppointmentsQuery } from "@/features/appointments/appointment-queries"
import type { Appointment } from "@/features/appointments/appointment.types"
import { routes } from "@/routes/routes"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
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

function statusLabel(status: Appointment["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function getNextAppointment(appointments: Appointment[]) {
  const now = Date.now()

  return (
    appointments
      .filter(
        (appointment) =>
          appointment.status === "CONFIRMED" &&
          new Date(appointment.startTime).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime(),
      )[0] ?? null
  )
}

export function StudentDashboardPage() {
  const navigate = useNavigate()
  const query = useAppointmentsQuery()

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
        <ErrorState onRetry={() => query.refetch()} />
      </main>
    )
  }

  const appointments = query.data ?? []
  const nextAppointment = getNextAppointment(appointments)

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "PENDING",
  ).length

  const recentAppointments = [...appointments]
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() -
        new Date(a.startTime).getTime(),
    )
    .slice(0, 4)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">
          Student portal
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your appointments
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Find faculty, book a suitable time, and keep track of your
          appointments in one place.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Next appointment
            </div>

            {nextAppointment ? (
              <>
                <div className="mt-6">
                  <p className="text-2xl font-semibold tracking-tight">
                    {formatDate(nextAppointment.startTime)}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="size-4" />
                    <span>
                      {formatTime(nextAppointment.startTime)} –{" "}
                      {formatTime(nextAppointment.endTime)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                      nextAppointment.status,
                    )}`}
                  >
                    {statusLabel(nextAppointment.status)}
                  </span>

                  <span className="text-sm text-muted-foreground">
                    Appointment confirmed
                  </span>
                </div>

                <Button
                  className="mt-6"
                  onClick={() =>
                    navigate(
                      `${routes.student}/appointments/${nextAppointment.id}`,
                    )
                  }
                >
                  View appointment
                  <ArrowRight className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-xl font-semibold">
                  Nothing scheduled yet
                </h2>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Find a faculty member and choose an available
                  appointment slot when you're ready.
                </p>

                <Button
                  className="mt-6"
                  onClick={() =>
                    navigate(`${routes.student}/faculty`)
                  }
                >
                  Find faculty
                  <Search className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">
            Your activity
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                {appointments.length}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Total appointments
              </p>
            </div>

            <div>
              <p className="text-3xl font-semibold tracking-tight">
                {pendingCount}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Pending requests
              </p>
            </div>
          </div>

          <div className="mt-8 border-t pt-5">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate(`${routes.student}/appointments`)
              }
            >
              View all appointments
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Recent appointments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Your latest appointment activity.
            </p>
          </div>

          {appointments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`${routes.student}/appointments`)
              }
            >
              View all
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        {recentAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <CalendarDays className="mx-auto size-5 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              No appointment activity
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Your appointments will appear here once you make a
              booking.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-2xl border bg-card">
            {recentAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() =>
                  navigate(
                    `${routes.student}/appointments/${appointment.id}`,
                  )
                }
                className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {formatDate(appointment.startTime)}
                  </p>

                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {formatTime(appointment.startTime)} –{" "}
                    {formatTime(appointment.endTime)}
                    {" · "}
                    {appointment.reason}
                  </p>
                </div>

                <span
                  className={`hidden rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusClass(
                    appointment.status,
                  )}`}
                >
                  {statusLabel(appointment.status)}
                </span>

                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
