import { CalendarDays, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAppointmentsQuery } from "./appointment-queries"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function statusClass(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    default:
      return "border-border bg-muted/50 text-muted-foreground"
  }
}

export function StudentAppointmentsPage() {
  const navigate = useNavigate()
  const query = useAppointmentsQuery()

  if (query.isPending) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState />
  }

  const appointments = query.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <section>
          <p className="text-sm font-medium text-muted-foreground">
            Student portal
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            My appointments
          </h1>

          <p className="mt-2 text-muted-foreground">
            View your upcoming and past appointment requests.
          </p>
        </section>

        <Button onClick={() => navigate("/student/faculty")}>
          Book appointment
        </Button>
      </div>

      {appointments.length === 0 ? (
        <section className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="size-6 text-muted-foreground" />
          </div>

          <h2 className="mt-4 font-semibold">No appointments yet</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Browse faculty to find an available appointment slot.
          </p>

          <Button
            className="mt-6"
            onClick={() => navigate("/student/faculty")}
          >
            Browse faculty
          </Button>
        </section>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <button
              key={appointment.id}
              type="button"
              onClick={() =>
                navigate(`/student/appointments/${appointment.id}`)
              }
              className="group rounded-xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 hidden size-9 shrink-0 items-center justify-center rounded-lg bg-muted sm:flex">
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {formatDateTime(appointment.startTime)}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Until {formatDateTime(appointment.endTime)}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                    appointment.status,
                  )}`}
                >
                  {appointment.status}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">
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
    </main>
  )
}
