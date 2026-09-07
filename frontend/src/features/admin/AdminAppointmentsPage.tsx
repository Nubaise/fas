import { CalendarDays, ChevronRight, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
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

export function AdminAppointmentsPage() {
  const navigate = useNavigate()
  const query = useAppointmentsQuery()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"ALL" | AppointmentStatus>("ALL")

  const appointments = query.data ?? []

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
    return <LoadingState />
  }

  if (query.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <ErrorState
          message="Unable to load appointments."
          onRetry={() => query.refetch()}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Admin Portal
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Appointments
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Review all faculty appointment activity. This page is
          read-only.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search appointment, student, faculty, or reason"
            aria-label="Search appointments"
            className="flex h-10 w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as "ALL" | AppointmentStatus,
            )
          }
          aria-label="Filter appointments by status"
          className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">
              Appointment records
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {filteredAppointments.length} of {appointments.length}{" "}
              appointment{appointments.length === 1 ? "" : "s"}
            </p>
          </div>

          {(search || status !== "ALL") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("")
                setStatus("ALL")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <CalendarDays
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-4 font-semibold">
              {appointments.length === 0
                ? "No appointments yet"
                : "No matching appointments"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {appointments.length === 0
                ? "Appointment records will appear here once students create bookings."
                : "Try changing the search text or status filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/appointments/${appointment.id}`,
                  )
                }
                className="group rounded-xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {formatDateTime(appointment.startTime)}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Until {formatDateTime(appointment.endTime)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                      appointment.status,
                    )}`}
                  >
                    {statusLabel(appointment.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Student
                    </p>
                    <p className="mt-1 break-all font-mono text-xs">
                      {appointment.studentId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Faculty
                    </p>
                    <p className="mt-1 break-all font-mono text-xs">
                      {appointment.facultyId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <p className="line-clamp-2 min-w-0 text-sm text-muted-foreground">
                    {appointment.reason}
                  </p>

                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
