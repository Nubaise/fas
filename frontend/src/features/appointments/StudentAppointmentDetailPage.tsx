import { ArrowLeft, CalendarDays, Clock3, FileText } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAppointmentQuery } from "./appointment-queries"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "full",
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

export function StudentAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const query = useAppointmentQuery(appointmentId ?? "")

  if (query.isPending) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState />
  }

  const appointment = query.data

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <Button
        variant="ghost"
        className="w-fit gap-2"
        onClick={() => navigate("/student/appointments")}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        My appointments
      </Button>

      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Appointment
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Appointment details
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review the current status and details of your appointment request.
        </p>
      </section>

      <section className="space-y-7 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>

          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusClass(
              appointment.status,
            )}`}
          >
            {appointment.status}
          </span>
        </div>

        <div className="flex gap-3">
          <CalendarDays
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm text-muted-foreground">Date and start</p>
            <p className="mt-1 font-medium">
              {formatDateTime(appointment.startTime)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Clock3
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm text-muted-foreground">End</p>
            <p className="mt-1 font-medium">
              {formatDateTime(appointment.endTime)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <FileText
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Reason for appointment
            </p>

            <p className="mt-1 whitespace-pre-wrap">{appointment.reason}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
