import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Search,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppointmentsQuery } from "@/features/appointments/appointment-queries"
import type { AppointmentStatus } from "@/features/appointments/appointment.types"

const statusOptions: Array<{
  value: "ALL" | AppointmentStatus
  label: string
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
]

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
      return CheckCircle2
    case "REJECTED":
    case "CANCELLED":
      return XCircle
    case "COMPLETED":
      return CheckCircle2
    case "PENDING":
    default:
      return Clock3
  }
}

function StatusBadge({
  status,
}: {
  status: AppointmentStatus
}) {
  const Icon = statusIcon(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
        status,
      )}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

export function AdminAppointmentsPage() {
  const navigate = useNavigate()
  const query = useAppointmentsQuery()

  const [search, setSearch] = useState("")
  const [status, setStatus] =
    useState<"ALL" | AppointmentStatus>("ALL")

  const appointments = query.data ?? []

  const counts = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter(
        (appointment) => appointment.status === "PENDING",
      ).length,
      confirmed: appointments.filter(
        (appointment) => appointment.status === "CONFIRMED",
      ).length,
      completed: appointments.filter(
        (appointment) => appointment.status === "COMPLETED",
      ).length,
    }),
    [appointments],
  )

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return appointments.filter((appointment) => {
      const matchesStatus =
        status === "ALL" || appointment.status === status

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        appointment.id,
        appointment.studentId,
        appointment.facultyId,
        appointment.reason,
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [appointments, search, status])

  if (query.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (query.isError) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Appointments
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Review appointment activity across FAS.
          </p>
        </section>

        <ErrorState
          message="Unable to load appointments. The appointment records could not be loaded."
          onRetry={() => {
            void query.refetch()
          }}
        />
      </main>
    )
  }

  const hasFilters = Boolean(search.trim()) || status !== "ALL"

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">
          Administration
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Appointments
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Review appointment activity across FAS. This workspace
          is read-only.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Total
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {counts.total}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Pending
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock3
                className="size-4"
                aria-hidden="true"
              />
            </div>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {counts.pending}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Confirmed
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2
                className="size-4"
                aria-hidden="true"
              />
            </div>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {counts.confirmed}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Completed
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2
                className="size-4"
                aria-hidden="true"
              />
            </div>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {counts.completed}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by ID, student, faculty, or reason"
              aria-label="Search appointments"
              className="pl-9"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  | "ALL"
                  | AppointmentStatus,
              )
            }
            aria-label="Filter appointments by status"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("")
                setStatus("ALL")
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Appointment records
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {filteredAppointments.length} of{" "}
              {appointments.length}{" "}
              {appointments.length === 1
                ? "appointment"
                : "appointments"}
            </p>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center sm:p-14">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarDays
                className="size-6"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-5 font-semibold tracking-tight">
              {appointments.length === 0
                ? "No appointments yet"
                : "No matching appointments"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {appointments.length === 0
                ? "Appointment records will appear here once students create bookings."
                : "Try changing the search text or status filter."}
            </p>

            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearch("")
                  setStatus("ALL")
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="hidden grid-cols-[minmax(260px,1.4fr)_minmax(180px,1fr)_160px_36px] items-center gap-5 border-b bg-muted/20 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
              <span>Appointment</span>
              <span>Participants</span>
              <span>Status</span>
              <span className="sr-only">Open</span>
            </div>

            <div className="divide-y">
              {filteredAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/appointments/${appointment.id}`,
                    )
                  }
                  className="group block w-full p-5 text-left transition-colors duration-150 hover:bg-muted/20 focus-visible:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(260px,1.4fr)_minmax(180px,1fr)_160px_36px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors group-hover:border-ring/30 group-hover:text-foreground">
                          <CalendarDays
                            className="size-4"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium">
                            {formatDate(
                              appointment.startTime,
                            )}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatTime(
                              appointment.startTime,
                            )}{" "}
                            –{" "}
                            {formatTime(
                              appointment.endTime,
                            )}
                          </p>

                          <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">
                            {appointment.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:block">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Student
                        </p>

                        <p className="mt-1 break-all font-mono text-xs">
                          {appointment.studentId}
                        </p>
                      </div>

                      <div className="lg:mt-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Faculty
                        </p>

                        <p className="mt-1 break-all font-mono text-xs">
                          {appointment.facultyId}
                        </p>
                      </div>
                    </div>

                    <div>
                      <StatusBadge
                        status={appointment.status}
                      />

                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {appointment.reason}
                      </p>
                    </div>

                    <ChevronRight
                      className="hidden size-5 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 lg:block"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
