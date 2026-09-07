import { useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
} from "lucide-react"

import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/errors"
import { routes } from "@/routes/routes"
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

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(value: string) {
  return new Date(`1970-01-01T${value}`).toLocaleTimeString([], {
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
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <ErrorState message="The selected appointment slot is incomplete or invalid." />
      </main>
    )
  }

  if (appointment) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-4 sm:p-6">
        <section className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">
              Appointment request
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Request submitted
            </h1>

            <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
              Your appointment request has been sent to the faculty member.
              You can track its status from your appointments.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/20 px-6 py-4 sm:px-7">
            <p className="text-sm font-medium">Appointment details</p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-7">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CalendarDays
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="mt-1 font-medium">{formatDate(date)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Clock3
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="mt-1 font-medium">
                  {formatTime(startTime)} - {formatTime(endTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-5 sm:px-7">
            <p className="text-sm text-muted-foreground">Status</p>

            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                appointment.status,
              )}`}
            >
              <Check className="size-3" aria-hidden="true" />
              {statusLabel(appointment.status)}
            </span>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() =>
              navigate(
                `${routes.student}/appointments/${appointment.id}`,
              )
            }
          >
            View appointment
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`${routes.student}/appointments`)}
          >
            My appointments
          </Button>
        </div>
      </main>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 p-4 sm:p-6 lg:gap-8">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <section className="space-y-3">
        <p className="text-sm font-medium text-primary">
          Appointment request
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Confirm your appointment
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Review your selected time and tell the faculty member what you
          would like to discuss.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/20 px-6 py-4 sm:px-7">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Selected time
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <p className="text-xl font-semibold tracking-tight">
            {formatDate(date)}
          </p>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
            <span>
              {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border bg-card p-6 sm:p-7">
          <div className="space-y-1">
            <Label htmlFor="reason">Reason for appointment</Label>

            <p className="text-sm leading-5 text-muted-foreground">
              Briefly explain what you would like to discuss with the
              faculty member.
            </p>
          </div>

          <textarea
            id="reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)

              if (error) {
                setError(null)
              }
            }}
            placeholder="For example: I would like to discuss my course project..."
            maxLength={2000}
            rows={6}
            aria-invalid={Boolean(error)}
            aria-describedby="reason-help reason-count"
            className="mt-4 flex min-h-36 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          />

          <div className="mt-2 flex items-start justify-between gap-4 text-xs text-muted-foreground">
            <span id="reason-help">
              Keep your request clear and specific.
            </span>

            <span id="reason-count" className="shrink-0 tabular-nums">
              {reason.length}/2000
            </span>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Your request will be sent to the selected faculty member for
            review.
          </p>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? (
              <>
                <span
                  className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
                  aria-hidden="true"
                />
                Submitting...
              </>
            ) : (
              <>
                Request appointment
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  )
}
