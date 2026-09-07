import { useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { routes } from "@/routes/routes"
import { useDepartmentsQuery, useFacultyQuery } from "./faculty-queries"
import { useFacultyAvailabilityQuery } from "@/features/availability/availability-queries"

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatTime(time: string) {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
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
    return <LoadingState />
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return <ErrorState />
  }

  if (!faculty) {
    return <ErrorState />
  }

  const department = departmentsQuery.data?.find(
    (item) => item.id === faculty.departmentId,
  )

  const slots = availabilityQuery.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <Button
        variant="ghost"
        className="w-fit gap-2"
        onClick={() => navigate(`${routes.student}/faculty`)}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to faculty
      </Button>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-6" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Faculty member
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {faculty.firstName} {faculty.lastName}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {department?.name ?? "Department unavailable"}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Employee #{faculty.employeeNumber}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Available appointments</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select a date to see the appointment slots currently available.
          </p>
        </div>

        <label className="flex max-w-xs flex-col gap-2 text-sm font-medium">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" aria-hidden="true" />
            Date
          </span>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        {availabilityQuery.isPending ? (
          <LoadingState />
        ) : availabilityQuery.isError ? (
          <ErrorState />
        ) : slots.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Clock3 className="size-6 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">No available slots</h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              There are no appointment slots available for this date. Try
              selecting another date.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <button
                key={`${slot.date}-${slot.startTime}-${slot.endTime}`}
                type="button"
                className="group rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  navigate(
                    `${routes.student}/appointments/new?facultyId=${faculty.id}&date=${slot.date}&startTime=${slot.startTime}&endTime=${slot.endTime}`,
                  )
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </span>

                  <ArrowLeft
                    className="size-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>

                <span className="mt-2 block text-sm text-muted-foreground">
                  Available
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
