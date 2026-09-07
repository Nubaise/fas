import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserRound,
  Users,
} from "lucide-react"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/AuthProvider"
import { useAppointmentsQuery } from "@/features/appointments/appointment-queries"
import type { Appointment } from "@/features/appointments/appointment.types"
import { routes } from "@/routes/routes"
import { useFacultyQuery } from "./faculty-queries"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
    month: "short",
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
      return "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/25 bg-destructive/10 text-destructive"
    case "PENDING":
      return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
    case "COMPLETED":
      return "border-border bg-muted text-muted-foreground"
  }
}

function statusLabel(status: Appointment["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function statusIcon(status: Appointment["status"]) {
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

type QuickActionProps = {
  icon: typeof CalendarDays
  title: string
  description: string
  actionLabel: string
  onClick: () => void
}

function QuickAction({
  icon: Icon,
  title,
  description,
  actionLabel,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border bg-card p-5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-border/80 hover:bg-muted/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:translate-y-0"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-150 group-hover:scale-[1.03]">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-4 font-semibold tracking-tight">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
        {actionLabel}

        <ArrowRight
          className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </button>
  )
}

export function FacultyDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const facultyQuery = useFacultyQuery()
  const appointmentsQuery = useAppointmentsQuery()

  const faculty = useMemo(
    () =>
      facultyQuery.data?.find(
        (item) => item.userId === user?.id,
      ),
    [facultyQuery.data, user?.id],
  )

  const appointments = appointmentsQuery.data ?? []

  const today = new Date().toISOString().slice(0, 10)

  const todaysAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.startTime.slice(0, 10) === today &&
            appointment.status === "CONFIRMED",
        )
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime(),
        ),
    [appointments, today],
  )

  const pendingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === "PENDING",
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        ),
    [appointments],
  )

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === "CONFIRMED" &&
            new Date(appointment.startTime).getTime() >=
              Date.now(),
        )
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime(),
        )
        .slice(0, 5),
    [appointments],
  )

  if (
    facultyQuery.isPending ||
    appointmentsQuery.isPending
  ) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (
    facultyQuery.isError ||
    appointmentsQuery.isError
  ) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <ErrorState
          message="Unable to load your faculty dashboard."
          onRetry={() => {
            void facultyQuery.refetch()
            void appointmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="rounded-2xl border border-dashed bg-card p-8">
          <p className="text-sm font-medium text-primary">
            Faculty portal
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Faculty profile not found
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your account is authenticated as faculty, but no
            faculty profile could be found.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">
          Faculty portal
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome, {faculty.firstName}
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Keep an eye on today's schedule, appointment
              requests, and upcoming meetings.
            </p>
          </div>

          {pendingAppointments.length > 0 && (
            <Button
              variant="outline"
              className="w-fit"
              onClick={() =>
                navigate(`${routes.faculty}/appointments`)
              }
            >
              Review requests
              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
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
                  Today's schedule
                </p>

                <p className="text-xs text-muted-foreground">
                  Confirmed appointments for today
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-2xl font-semibold tracking-tight">
              {todaysAppointments.length === 0
                ? "No appointments today"
                : `${todaysAppointments.length} ${
                    todaysAppointments.length === 1
                      ? "appointment"
                      : "appointments"
                  } today`}
            </p>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {todaysAppointments.length === 0
                ? "Your confirmed appointments for today will appear here."
                : "Your confirmed appointments scheduled for today."}
            </p>

            {todaysAppointments.length > 0 && (
              <div className="mt-5 divide-y rounded-xl border">
                {todaysAppointments.slice(0, 3).map(
                  (appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          `${routes.faculty}/appointments/${appointment.id}`,
                        )
                      }
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Clock3
                          className="size-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {formatTime(
                            appointment.startTime,
                          )}{" "}
                          –{" "}
                          {formatTime(
                            appointment.endTime,
                          )}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {appointment.reason}
                        </p>
                      </div>

                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  ),
                )}
              </div>
            )}

            <Button
              className="mt-6"
              onClick={() =>
                navigate(`${routes.faculty}/appointments`)
              }
            >
              View appointments
              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-2xl border bg-card ${
            pendingAppointments.length > 0
              ? "border-amber-500/25"
              : ""
          }`}
        >
          <div className="border-b bg-muted/15 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  pendingAppointments.length > 0
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Users
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Needs attention
                </p>

                <p className="text-xs text-muted-foreground">
                  Appointment requests awaiting review
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-3xl font-semibold tracking-tight">
              {pendingAppointments.length}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Pending appointment{" "}
              {pendingAppointments.length === 1
                ? "request"
                : "requests"}
            </p>

            {pendingAppointments.length > 0 && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Review pending requests to keep your
                appointment schedule up to date.
              </p>
            )}

            <Button
              variant={
                pendingAppointments.length > 0
                  ? "default"
                  : "outline"
              }
              className="mt-6 w-full"
              onClick={() =>
                navigate(`${routes.faculty}/appointments`)
              }
            >
              {pendingAppointments.length > 0
                ? "Review requests"
                : "View appointments"}
              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          icon={Clock3}
          title="Manage availability"
          description="Configure your weekly schedule and availability."
          actionLabel="Manage availability"
          onClick={() =>
            navigate(`${routes.faculty}/availability`)
          }
        />

        <QuickAction
          icon={CalendarDays}
          title="Appointments"
          description="Review requests and manage your appointments."
          actionLabel="View appointments"
          onClick={() =>
            navigate(`${routes.faculty}/appointments`)
          }
        />

        <QuickAction
          icon={UserRound}
          title="Your profile"
          description="View your faculty information and update your name."
          actionLabel="Edit profile"
          onClick={() =>
            navigate(`${routes.faculty}/profile`)
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Upcoming appointments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Your next confirmed appointments.
            </p>
          </div>

          {upcomingAppointments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`${routes.faculty}/appointments`)
              }
            >
              View all
              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <p className="mt-4 text-sm font-medium">
              No upcoming appointments
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
              Confirmed appointments will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            {upcomingAppointments.map((appointment) => {
              const StatusIcon = statusIcon(
                appointment.status,
              )

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `${routes.faculty}/appointments/${appointment.id}`,
                    )
                  }
                  className="group flex w-full items-center gap-4 border-b p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset last:border-b-0 sm:p-5"
                >
                  <div className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:flex">
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
                        {formatTime(
                          appointment.startTime,
                        )}{" "}
                        –{" "}
                        {formatTime(
                          appointment.endTime,
                        )}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {appointment.reason}
                    </p>
                  </div>

                  <span
                    className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusClass(
                      appointment.status,
                    )}`}
                  >
                    <StatusIcon
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    {statusLabel(appointment.status)}
                  </span>

                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
