import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Clock3, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ErrorState } from "@/components/shared/ErrorState"
import { ApiError } from "@/lib/api/errors"
import { useCreateAppointmentMutation } from "./appointment-queries"
import type { Appointment } from "./appointment.types"

function toOffsetDateTime(date: string, time: string) {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0")
  const minutes = String(absoluteOffset % 60).padStart(2, "0")

  return `${date}T${time}:00${sign}${hours}:${minutes}`
}

export function StudentBookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mutation = useCreateAppointmentMutation()

  const facultyId = searchParams.get("facultyId") ?? ""
  const date = searchParams.get("date") ?? ""
  const startTime = searchParams.get("startTime") ?? ""
  const endTime = searchParams.get("endTime") ?? ""

  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  if (!facultyId || !date || !startTime || !endTime) {
    return (
      <main className="mx-auto w-full max-w-2xl p-6">
        <ErrorState />
      </main>
    )
  }

  if (appointment) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        <section className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Appointment request submitted
          </h1>

          <p className="mt-2 text-muted-foreground">
            Your appointment request has been sent to the faculty member.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-semibold text-foreground">
              {appointment.status}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() =>
                navigate(`/student/appointments/${appointment.id}`)
              }
            >
              View appointment
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/student/appointments")}
            >
              My appointments
            </Button>
          </div>
        </section>
      </main>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      setError("Please provide a reason for the appointment.")
      return
    }

    if (trimmedReason.length > 2000) {
      setError("The reason must be 2000 characters or fewer.")
      return
    }

    setError(null)

    try {
      const result = await mutation.mutateAsync({
        facultyId,
        startTime: toOffsetDateTime(date, startTime),
        endTime: toOffsetDateTime(date, endTime),
        reason: trimmedReason,
      })

      setAppointment(result)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message)
      } else {
        setError("Unable to submit the appointment request.")
      }
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <Button
        variant="ghost"
        className="w-fit gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Appointment request
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Confirm your appointment
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review the selected time and tell the faculty member what you would
          like to discuss.
        </p>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div className="flex gap-3">
            <CalendarDays
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <div>
              <dt className="text-sm text-muted-foreground">Date</dt>
              <dd className="mt-1 font-medium">{date}</dd>
            </div>
          </div>

          <div className="flex gap-3">
            <Clock3
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <div>
              <dt className="text-sm text-muted-foreground">Time</dt>
              <dd className="mt-1 font-medium">
                {startTime} – {endTime}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for appointment</Label>

          <textarea
            id="reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              if (error) {
                setError(null)
              }
            }}
            placeholder="Briefly explain what you would like to discuss..."
            maxLength={2000}
            rows={6}
            className="flex w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex justify-between gap-4 text-xs text-muted-foreground">
            <span>Keep your request clear and specific.</span>
            <span>{reason.length}/2000</span>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full sm:w-auto"
        >
          {mutation.isPending ? "Submitting..." : "Request appointment"}
        </Button>
      </form>
    </main>
  )
}
