import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  UserRound,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { useFacultyAvailabilityQuery } from "@/features/availability/availability-queries"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { routes } from "@/routes/routes"
import { useDepartmentsQuery, useFacultyQuery } from "./faculty-queries"

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatTime(time: string) {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatSelectedDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export function StudentFacultyDetailPage() {
  const { facultyId } = useParams()
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  const availabilityQuery = useFacultyAvailabilityQuery(
    facultyId ?? "",
    selectedDate,
  )

  const faculty = useMemo(
    () => facultyQuery.data?.find((member) => member.id === facultyId),
    [facultyQuery.data, facultyId],
  )

  if (facultyQuery.isPending || departmentsQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <LoadingState />
      </main>
    )
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <ErrorState
          onRetry={() => {
            void facultyQuery.refetch()
            void departmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  if (!faculty) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <ErrorState message="The requested faculty member could not be found." />
      </main>
    )
  }

  const department = departmentsQuery.data?.find(
    (item) => item.id === faculty.departmentId,
  )

  const slots = availabilityQuery.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:gap-8">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-2"
        onClick={() => navigate(`${routes.student}/faculty`)}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to faculty
      </Button>

      <section className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8">
        <aside className="rounded-2xl border bg-card p-6 sm:p-7 lg:sticky lg:top-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="size-6" aria-hidden="true" />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-primary">
              Faculty member
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {faculty.firstName} {faculty.lastName}
            </h1>
          </div>

          <div className="mt-6 space-y-3 border-t pt-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Department
              </p>

              <p className="mt-1 text-sm font-medium">
                {department?.name ?? "Department unavailable"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Employee number
              </p>

              <p className="mt-1 text-sm font-medium">
                {faculty.employeeNumber}
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-xl bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-medium">Book an appointment</p>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Select a date and choose an available time that works for
                  you.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <header className="border-b pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">
                  Availability
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  Choose a date and time
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Select a date to see the appointment times currently
                  available with this faculty member.
                </p>
              </div>

              <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-muted sm:flex">
                <Clock3
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>
          </header>

          <div className="py-6">
            <label
              htmlFor="appointment-date"
              className="text-sm font-medium"
            >
              Date
            </label>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <input
                  id="appointment-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 pl-9 text-sm shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Times shown use your local time.
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-medium">
                  {formatSelectedDate(selectedDate)}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {availabilityQuery.isPending
                    ? "Checking availability…"
                    : slots.length > 0
                      ? `${slots.length} available ${
                          slots.length === 1 ? "slot" : "slots"
                        }`
                      : "No available slots"}
                </p>
              </div>

              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted sm:hidden">
                <Clock3
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>

            {availabilityQuery.isPending ? (
              <div className="mt-6 rounded-xl border bg-muted/10 p-6">
                <LoadingState />
              </div>
            ) : availabilityQuery.isError ? (
              <div className="mt-6">
                <ErrorState
                  onRetry={() => void availabilityQuery.refetch()}
                />
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Clock3
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-3 text-sm font-semibold">
                  No available slots
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-muted-foreground">
                  There are no appointment times available on this date.
                  Choose another date to continue.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.date}-${slot.startTime}-${slot.endTime}`}
                      type="button"
                      onClick={() =>
                        navigate(
                          `${routes.student}/appointments/new?facultyId=${faculty.id}&date=${slot.date}&startTime=${slot.startTime}&endTime=${slot.endTime}`,
                        )
                      }
                      className={[
                        "group flex min-h-12 items-center justify-between gap-4 rounded-xl border bg-background px-4 text-left",
                        "transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out",
                        "hover:border-primary/40 hover:bg-primary/5 hover:shadow-xs",
                        "active:translate-y-px active:bg-primary/10",
                        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        "dark:hover:border-primary/50 dark:hover:bg-primary/10",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-150 group-hover:bg-primary/15">
                          <Clock3
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </div>

                        <span className="text-sm font-medium">
                          {formatTime(slot.startTime)} -{" "}
                          {formatTime(slot.endTime)}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs font-medium text-primary sm:block">
                          Select
                        </span>

                        <ArrowRight
                          className="size-4 text-muted-foreground transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Choose a time to continue to appointment confirmation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
