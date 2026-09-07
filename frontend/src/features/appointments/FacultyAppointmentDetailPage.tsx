import { useEffect, useState, type ReactNode } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  X,
  XCircle,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

function formatTime(value: string) {
  return value.slice(0, 5)
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
    case "PENDING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
    case "CONFIRMED":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
    case "REJECTED":
    case "CANCELLED":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    case "COMPLETED":
      return "border-border bg-muted text-muted-foreground"
  }
}

function StatusIcon({ status }: { status: AppointmentStatus }) {
  switch (status) {
    case "PENDING":
      return <Clock3 className="size-4" aria-hidden="true" />
    case "CONFIRMED":
      return <CheckCircle2 className="size-4" aria-hidden="true" />
    case "REJECTED":
    case "CANCELLED":
      return <XCircle className="size-4" aria-hidden="true" />
    case "COMPLETED":
      return <CheckCircle2 className="size-4" aria-hidden="true" />
  }
}

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm font-medium">{children}</div>
      </div>
    </div>
  )
}

function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Go back",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onCancel()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onCancel, pending])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-confirmation-title"
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              destructive
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            {destructive ? (
              <AlertCircle className="size-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0">
            <h2
              id="appointment-confirmation-title"
              className="font-semibold tracking-tight"
            >
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function FacultyAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [confirmationAction, setConfirmationAction] = useState<
    "reject" | "cancel" | "complete" | null
  >(null)

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string
    endTime: string
  } | null>(null)
  const [rescheduleError, setRescheduleError] = useState<string | null>(
    null,
  )
  const [actionError, setActionError] = useState<string | null>(null)

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
    if (appointmentQuery.data && !rescheduleDate) {
      setRescheduleDate(
        toDateInputValue(appointmentQuery.data.startTime),
      )
    }
  }, [appointmentQuery.data, rescheduleDate])

  const isLifecycleMutationPending =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    completeMutation.isPending

  if (appointmentQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (appointmentQuery.isError || !appointmentQuery.data) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <ErrorState
          message="Unable to load this appointment."
          onRetry={() => appointmentQuery.refetch()}
        />
      </main>
    )
  }

  const appointment = appointmentQuery.data

  async function handleAccept() {
    setActionError(null)

    try {
      await acceptMutation.mutateAsync(appointment.id)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setActionError(caughtError.message)
      } else {
        setActionError("Unable to accept this appointment.")
      }
    }
  }

  async function handleReject() {
    setActionError(null)

    try {
      await rejectMutation.mutateAsync(appointment.id)
      setConfirmationAction(null)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setActionError(caughtError.message)
      } else {
        setActionError("Unable to reject this appointment.")
      }
    }
  }

  async function handleCancel() {
    setActionError(null)

    try {
      await cancelMutation.mutateAsync(appointment.id)
      setConfirmationAction(null)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setActionError(caughtError.message)
      } else {
        setActionError("Unable to cancel this appointment.")
      }
    }
  }

  async function handleComplete() {
    setActionError(null)

    try {
      await completeMutation.mutateAsync(appointment.id)
      setConfirmationAction(null)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setActionError(caughtError.message)
      } else {
        setActionError("Unable to complete this appointment.")
      }
    }
  }

  function openReschedule() {
    setActionError(null)
    setRescheduleError(null)
    setSelectedSlot(null)
    setRescheduleDate(toDateInputValue(appointment.startTime))
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
    if (!rescheduleDate) {
      setRescheduleError("Please select a date.")
      return
    }

    if (!selectedSlot) {
      setRescheduleError("Please select an available slot.")
      return
    }

    setRescheduleError(null)
    setActionError(null)

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
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2 px-2"
          onClick={() => navigate("/faculty/appointments")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Appointments
        </Button>

        <section className="space-y-3">
          <p className="text-sm font-medium text-primary">
            Faculty portal
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Appointment details
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Review the request, appointment details, and available
                actions.
              </p>
            </div>

            <div
              className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusClass(
                appointment.status,
              )}`}
            >
              <StatusIcon status={appointment.status} />
              {statusLabel(appointment.status)}
            </div>
          </div>
        </section>

        {actionError ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{actionError}</span>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="size-5 text-primary"
                  aria-hidden="true"
                />

                <h2 className="font-semibold tracking-tight">
                  Appointment information
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                The current scheduled time and reason for the appointment.
              </p>
            </div>

            <div className="grid gap-7 p-5 sm:p-6">
              <DetailItem
                icon={
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                label="Date"
              >
                {new Date(appointment.startTime).toLocaleDateString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </DetailItem>

              <DetailItem
                icon={
                  <Clock3
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                label="Time"
              >
                {formatTime(appointment.startTime)} –{" "}
                {formatTime(appointment.endTime)}
              </DetailItem>

              <DetailItem
                icon={
                  <FileText
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                label="Reason for appointment"
              >
                <p className="whitespace-pre-wrap font-normal leading-6">
                  {appointment.reason}
                </p>
              </DetailItem>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border bg-card p-5">
              <p className="text-sm font-medium text-muted-foreground">
                Request status
              </p>

              <div
                className={`mt-3 flex items-center gap-2 rounded-xl border p-3 ${statusClass(
                  appointment.status,
                )}`}
              >
                <StatusIcon status={appointment.status} />

                <div>
                  <p className="text-sm font-semibold">
                    {statusLabel(appointment.status)}
                  </p>

                  <p className="mt-0.5 text-xs opacity-80">
                    Current appointment state
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5">
              <p className="text-sm font-medium text-muted-foreground">
                Student
              </p>

              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                {appointment.studentId}
              </p>

              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Student details are represented by the appointment
                record because no student profile data is embedded in
                this appointment response.
              </p>
            </section>
          </aside>
        </div>

        {appointment.status === "PENDING" ? (
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Review request
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Accept the request or reject it if the proposed
                  appointment cannot be accommodated.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleAccept}
                  disabled={isLifecycleMutationPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check
                      className="size-4"
                      aria-hidden="true"
                    />
                  )}

                  {acceptMutation.isPending
                    ? "Accepting..."
                    : "Accept request"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActionError(null)
                    setConfirmationAction("reject")
                  }}
                  disabled={isLifecycleMutationPending}
                >
                  <X className="size-4" aria-hidden="true" />
                  Reject request
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {appointment.status === "CONFIRMED" ? (
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div>
              <h2 className="font-semibold tracking-tight">
                Manage appointment
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Reschedule the appointment or update its lifecycle
                status.
              </p>
            </div>

            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
              <Button
                type="button"
                onClick={openReschedule}
                disabled={isLifecycleMutationPending}
              >
                <CalendarDays
                  className="size-4"
                  aria-hidden="true"
                />
                Reschedule
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActionError(null)
                  setConfirmationAction("complete")
                }}
                disabled={isLifecycleMutationPending}
              >
                <Check className="size-4" aria-hidden="true" />
                Mark completed
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActionError(null)
                  setConfirmationAction("cancel")
                }}
                disabled={isLifecycleMutationPending}
              >
                <X className="size-4" aria-hidden="true" />
                Cancel appointment
              </Button>
            </div>
          </section>
        ) : null}

        {isRescheduleOpen && appointment.status === "CONFIRMED" ? (
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Reschedule appointment
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Choose a date and select one of the available slots
                  generated from your availability.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={closeReschedule}
                disabled={rescheduleMutation.isPending}
                aria-label="Close reschedule"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-6 grid gap-6">
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
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    Available slots
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Select a slot for the new appointment time.
                  </p>
                </div>

                {availabilityQuery.isPending ? (
                  <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Loading available slots...
                  </div>
                ) : null}

                {availabilityQuery.isError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    Unable to load available slots for this date.
                  </div>
                ) : null}

                {availabilityQuery.isSuccess &&
                availabilityQuery.data.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <CalendarDays
                      className="mx-auto size-5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <p className="mt-2 text-sm font-medium">
                      No available slots
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose another date with availability.
                    </p>
                  </div>
                ) : null}

                {availabilityQuery.isSuccess &&
                availabilityQuery.data.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "bg-background hover:bg-muted/60 hover:border-ring/50"
                          }`}
                        >
                          <span className="font-medium">
                            {formatTime(slot.startTime)}
                          </span>

                          <span className="mx-1 text-muted-foreground">
                            –
                          </span>

                          <span className="font-medium">
                            {formatTime(slot.endTime)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              {rescheduleError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {rescheduleError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeReschedule}
                  disabled={rescheduleMutation.isPending}
                >
                  Close
                </Button>

                <Button
                  type="button"
                  onClick={handleReschedule}
                  disabled={
                    !selectedSlot ||
                    !rescheduleDate ||
                    rescheduleMutation.isPending
                  }
                >
                  {rescheduleMutation.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <CalendarDays
                      className="size-4"
                      aria-hidden="true"
                    />
                  )}

                  {rescheduleMutation.isPending
                    ? "Rescheduling..."
                    : "Confirm reschedule"}
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {confirmationAction === "reject" ? (
        <ConfirmationDialog
          title="Reject appointment request?"
          description="The student will no longer have this appointment request as a pending request."
          confirmLabel="Reject request"
          destructive
          pending={rejectMutation.isPending}
          onCancel={() => setConfirmationAction(null)}
          onConfirm={handleReject}
        />
      ) : null}

      {confirmationAction === "cancel" ? (
        <ConfirmationDialog
          title="Cancel this appointment?"
          description="This will cancel the confirmed appointment. This action changes the appointment lifecycle state."
          confirmLabel="Cancel appointment"
          destructive
          pending={cancelMutation.isPending}
          onCancel={() => setConfirmationAction(null)}
          onConfirm={handleCancel}
        />
      ) : null}

      {confirmationAction === "complete" ? (
        <ConfirmationDialog
          title="Mark appointment as completed?"
          description="Confirm that this appointment has taken place and should be marked as completed."
          confirmLabel="Mark completed"
          pending={completeMutation.isPending}
          onCancel={() => setConfirmationAction(null)}
          onConfirm={handleComplete}
        />
      ) : null}
    </>
  )
}
