import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  X,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { ApiError } from "@/lib/api/errors"
import { useAuth } from "@/features/auth/AuthProvider"
import { useFacultyQuery } from "@/features/faculty/faculty-queries"
import { useFacultyAvailabilityQuery } from "@/features/availability/availability-queries"

import {
  useAcceptAppointmentMutation,
  useAppointmentQuery,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useRejectAppointmentMutation,
  useRescheduleAppointmentMutation,
} from "./appointment-queries"

import type { AppointmentStatus } from "./appointment.types"

function toDateInputValue(value: string) {
  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function toOffsetDateTime(date: string, time: string) {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0")
  const minutes = String(absoluteOffset % 60).padStart(2, "0")

  return `${date}T${time}:00${sign}${hours}:${minutes}`
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "full",
    timeStyle: "short",
  })
}

function formatTime(value: string) {
  return value.slice(0, 5)
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

export function FacultyAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string
    endTime: string
  } | null>(null)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  const appointmentQuery = useAppointmentQuery(appointmentId ?? "")
  const facultyQuery = useFacultyQuery()

  const faculty = facultyQuery.data?.find(
    (item) => item.userId === user?.id,
  )

  const availabilityQuery = useFacultyAvailabilityQuery(
    faculty?.id ?? "",
    rescheduleDate,
  )

  const acceptMutation = useAcceptAppointmentMutation()
  const rejectMutation = useRejectAppointmentMutation()
  const cancelMutation = useCancelAppointmentMutation()
  const completeMutation = useCompleteAppointmentMutation()
  const rescheduleMutation = useRescheduleAppointmentMutation()

  useEffect(() => {
    if (
      appointmentQuery.data &&
      !rescheduleDate
    ) {
      setRescheduleDate(
        toDateInputValue(appointmentQuery.data.startTime),
      )
    }
  }, [appointmentQuery.data, rescheduleDate])

  if (appointmentQuery.isPending) {
    return <LoadingState />
  }

  if (appointmentQuery.isError || !appointmentQuery.data) {
    return <ErrorState />
  }

  const appointment = appointmentQuery.data

  const isLifecycleMutationPending =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    completeMutation.isPending

  async function handleAccept() {
    try {
      await acceptMutation.mutateAsync(appointment.id)
    } catch {
      // Mutation error is displayed below.
    }
  }

  async function handleReject() {
    const confirmed = window.confirm(
      "Reject this appointment request?",
    )

    if (!confirmed) {
      return
    }

    try {
      await rejectMutation.mutateAsync(appointment.id)
    } catch {
      // Mutation error is displayed below.
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Cancel this confirmed appointment?",
    )

    if (!confirmed) {
      return
    }

    try {
      await cancelMutation.mutateAsync(appointment.id)
    } catch {
      // Mutation error is displayed below.
    }
  }

  async function handleComplete() {
    const confirmed = window.confirm(
      "Mark this appointment as completed?",
    )

    if (!confirmed) {
      return
    }

    try {
      await completeMutation.mutateAsync(appointment.id)
    } catch {
      // Mutation error is displayed below.
    }
  }

  function openReschedule() {
    setRescheduleError(null)
    setSelectedSlot(null)
    setRescheduleDate(
      toDateInputValue(appointment.startTime),
    )
    setIsRescheduleOpen(true)
  }

  function closeReschedule() {
    if (rescheduleMutation.isPending) {
      return
    }

    setIsRescheduleOpen(false)
    setSelectedSlot(null)
    setRescheduleError(null)
  }

  async function handleReschedule() {
    if (!selectedSlot) {
      setRescheduleError("Please select an available slot.")
      return
    }

    if (!rescheduleDate) {
      setRescheduleError("Please select a date.")
      return
    }

    setRescheduleError(null)

    try {
      await rescheduleMutation.mutateAsync({
        id: appointment.id,
        data: {
          startTime: toOffsetDateTime(
            rescheduleDate,
            formatTime(selectedSlot.startTime),
          ),
          endTime: toOffsetDateTime(
            rescheduleDate,
            formatTime(selectedSlot.endTime),
          ),
        },
      })

      setIsRescheduleOpen(false)
      setSelectedSlot(null)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setRescheduleError(caughtError.message)
      } else {
        setRescheduleError(
          "Unable to reschedule the appointment.",
        )
      }
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <Button
        variant="ghost"
        className="w-fit gap-2"
        onClick={() => navigate("/faculty/appointments")}
      >
        <ArrowLeft
          className="size-4"
          aria-hidden="true"
        />
        Appointments
      </Button>

      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Faculty Portal
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Appointment details
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review the appointment and perform the available
          lifecycle actions.
        </p>
      </section>

      <section className="space-y-7 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">
            Status
          </p>

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
            <p className="text-sm text-muted-foreground">
              Date and start
            </p>

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
            <p className="text-sm text-muted-foreground">
              End
            </p>

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

            <p className="mt-1 whitespace-pre-wrap">
              {appointment.reason}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Student
          </p>

          <p className="mt-1 break-all font-mono text-sm">
            {appointment.studentId}
          </p>
        </div>
      </section>

      {(acceptMutation.isError ||
        rejectMutation.isError ||
        cancelMutation.isError ||
        completeMutation.isError) && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          Unable to update this appointment. It may have
          changed since you opened this page. Please try again.
        </p>
      )}

      {appointment.status === "PENDING" && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm sm:flex-row">
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={isLifecycleMutationPending}
          >
            <Check
              className="mr-2 size-4"
              aria-hidden="true"
            />

            {acceptMutation.isPending
              ? "Accepting..."
              : "Accept"}
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReject}
            disabled={isLifecycleMutationPending}
          >
            <X
              className="mr-2 size-4"
              aria-hidden="true"
            />

            {rejectMutation.isPending
              ? "Rejecting..."
              : "Reject"}
          </Button>
        </section>
      )}

      {appointment.status === "CONFIRMED" && (
        <section className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <h2 className="font-semibold">
              Manage appointment
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You can reschedule, complete, or cancel this
              confirmed appointment.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={openReschedule}
              disabled={isLifecycleMutationPending}
            >
              <CalendarDays
                className="mr-2 size-4"
                aria-hidden="true"
              />
              Reschedule
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={handleComplete}
              disabled={isLifecycleMutationPending}
            >
              <Check
                className="mr-2 size-4"
                aria-hidden="true"
              />

              {completeMutation.isPending
                ? "Completing..."
                : "Mark completed"}
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isLifecycleMutationPending}
            >
              <X
                className="mr-2 size-4"
                aria-hidden="true"
              />

              {cancelMutation.isPending
                ? "Cancelling..."
                : "Cancel"}
            </Button>
          </div>
        </section>
      )}

      {isRescheduleOpen && appointment.status === "CONFIRMED" && (
        <section className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <h2 className="font-semibold">
              Reschedule appointment
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose a date and select one of the available
              slots generated from your availability schedule.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reschedule-date">
              New date
            </Label>

            <input
              id="reschedule-date"
              type="date"
              value={rescheduleDate}
              onChange={(event) => {
                setRescheduleDate(event.target.value)
                setSelectedSlot(null)
                setRescheduleError(null)
              }}
              min={new Date().toISOString().slice(0, 10)}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">
                Available slots
              </p>

              <p className="text-xs text-muted-foreground">
                Select a generated slot for the new appointment.
              </p>
            </div>

            {availabilityQuery.isPending && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Loading available slots...
              </div>
            )}

            {availabilityQuery.isError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive"
              >
                Unable to load available slots for this date.
              </div>
            )}

            {availabilityQuery.isSuccess &&
              availabilityQuery.data.length === 0 && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No available slots for this date.
                </div>
              )}

            {availabilityQuery.isSuccess &&
              availabilityQuery.data.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {availabilityQuery.data.map((slot) => {
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.endTime === slot.endTime

                    return (
                      <button
                        key={`${slot.startTime}-${slot.endTime}`}
                        type="button"
                        onClick={() => {
                          setSelectedSlot({
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                          })
                          setRescheduleError(null)
                        }}
                        className={`rounded-lg border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-background hover:bg-accent"
                        }`}
                      >
                        <span className="font-medium">
                          {formatTime(slot.startTime)}
                        </span>

                        <span className="text-muted-foreground">
                          {" "}
                          –{" "}
                        </span>

                        <span className="font-medium">
                          {formatTime(slot.endTime)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
          </div>

          {rescheduleError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {rescheduleError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={closeReschedule}
              disabled={rescheduleMutation.isPending}
            >
              Close
            </Button>

            <Button
              onClick={handleReschedule}
              disabled={
                !selectedSlot ||
                rescheduleMutation.isPending
              }
            >
              {rescheduleMutation.isPending
                ? "Rescheduling..."
                : "Confirm reschedule"}
            </Button>
          </div>
        </section>
      )}
    </main>
  )
}
