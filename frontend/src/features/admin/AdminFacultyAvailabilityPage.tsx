import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"

import {
  useCreateAvailabilityScheduleMutation,
  useDeleteAvailabilityScheduleMutation,
  useFacultySchedulesQuery,
  useUpdateAvailabilityScheduleMutation,
} from "@/features/availability/availability-queries"

import {
  useCreateAvailabilityExceptionMutation,
  useDeleteAvailabilityExceptionMutation,
  useFacultyExceptionsQuery,
  useUpdateAvailabilityExceptionMutation,
} from "@/features/availability/availability-exception-queries"

import type { AvailabilitySchedule } from "@/features/availability/availability.types"
import type { AvailabilityException } from "@/features/availability/availability-exception-api"

import {
  useDepartmentsQuery,
  useFacultyQuery,
} from "@/features/faculty/faculty-queries"

import { routes } from "@/routes/routes"

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

const SLOT_DURATIONS = [15, 30, 45, 60] as const

type ScheduleFormValues = {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: 15 | 30 | 45 | 60
  isActive: boolean
}

type ExceptionFormValues = {
  date: string
  isFullDay: boolean
  startTime: string
  endTime: string
  reason: string
}

type DeleteTarget =
  | {
      type: "schedule"
      item: AvailabilitySchedule
    }
  | {
      type: "exception"
      item: AvailabilityException
    }
  | null

const defaultScheduleFormValues: ScheduleFormValues = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 30,
  isActive: true,
}

const defaultExceptionFormValues: ExceptionFormValues = {
  date: "",
  isFullDay: true,
  startTime: "09:00",
  endTime: "17:00",
  reason: "",
}

function formatTime(time: string) {
  const [hoursString, minutes] = time.slice(0, 5).split(":")
  const hours = Number(hoursString)

  if (Number.isNaN(hours)) {
    return time.slice(0, 5)
  }

  const suffix = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutes} ${suffix}`
}

function formatExceptionDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function Modal({
  title,
  description,
  children,
  onClose,
  closeDisabled = false,
  maxWidth = "max-w-lg",
}: {
  title: string
  description?: string
  children: React.ReactNode
  onClose: () => void
  closeDisabled?: boolean
  maxWidth?: string
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !closeDisabled) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [closeDisabled, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-modal-title"
        className={`w-full ${maxWidth} overflow-hidden rounded-2xl border bg-card shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div className="min-w-0">
            <h2
              id="availability-modal-title"
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {children}
      </div>
    </div>
  )
}

function StatusPill({
  active,
}: {
  active: boolean
}) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      <span
        className={
          active
            ? "size-1.5 rounded-full bg-green-500"
            : "size-1.5 rounded-full bg-muted-foreground/50"
        }
        aria-hidden="true"
      />
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-dashed bg-card p-8 text-center sm:p-10">
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <CalendarDays className="size-5" aria-hidden="true" />
      </div>

      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}

export function AdminFacultyAvailabilityPage() {
  const navigate = useNavigate()
  const { facultyId } = useParams()

  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] =
    useState<AvailabilitySchedule | null>(null)

  const [scheduleFormValues, setScheduleFormValues] =
    useState<ScheduleFormValues>(defaultScheduleFormValues)

  const [scheduleFormError, setScheduleFormError] =
    useState<string | null>(null)

  const [isExceptionFormOpen, setIsExceptionFormOpen] = useState(false)
  const [editingException, setEditingException] =
    useState<AvailabilityException | null>(null)

  const [exceptionFormValues, setExceptionFormValues] =
    useState<ExceptionFormValues>(defaultExceptionFormValues)

  const [exceptionFormError, setExceptionFormError] =
    useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget>(null)

  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null)

  const [actionError, setActionError] =
    useState<string | null>(null)

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  const faculty = useMemo(
    () => facultyQuery.data?.find((item) => item.id === facultyId),
    [facultyQuery.data, facultyId],
  )

  const department = useMemo(
    () =>
      departmentsQuery.data?.find(
        (item) => item.id === faculty?.departmentId,
      ),
    [departmentsQuery.data, faculty?.departmentId],
  )

  const schedulesQuery = useFacultySchedulesQuery(faculty?.id ?? "")
  const exceptionsQuery = useFacultyExceptionsQuery(faculty?.id ?? "")

  const createScheduleMutation =
    useCreateAvailabilityScheduleMutation()

  const updateScheduleMutation =
    useUpdateAvailabilityScheduleMutation()

  const deleteScheduleMutation =
    useDeleteAvailabilityScheduleMutation()

  const createExceptionMutation =
    useCreateAvailabilityExceptionMutation()

  const updateExceptionMutation =
    useUpdateAvailabilityExceptionMutation()

  const deleteExceptionMutation =
    useDeleteAvailabilityExceptionMutation()

  const isScheduleSaving =
    createScheduleMutation.isPending ||
    updateScheduleMutation.isPending

  const isExceptionSaving =
    createExceptionMutation.isPending ||
    updateExceptionMutation.isPending

  const isDeleting =
    deleteScheduleMutation.isPending ||
    deleteExceptionMutation.isPending

  const schedules = useMemo(
    () =>
      [...(schedulesQuery.data ?? [])].sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek ||
          a.startTime.localeCompare(b.startTime),
      ),
    [schedulesQuery.data],
  )

  const exceptions = useMemo(
    () =>
      [...(exceptionsQuery.data ?? [])].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    [exceptionsQuery.data],
  )

  const activeScheduleCount = schedules.filter(
    (schedule) => schedule.isActive,
  ).length

  const openCreateScheduleForm = () => {
    setEditingSchedule(null)
    setScheduleFormValues(defaultScheduleFormValues)
    setScheduleFormError(null)
    setActionError(null)
    setActionSuccess(null)
    setIsScheduleFormOpen(true)
  }

  const openEditScheduleForm = (schedule: AvailabilitySchedule) => {
    setEditingSchedule(schedule)

    setScheduleFormValues({
      dayOfWeek: schedule.dayOfWeek,
      startTime: formatTimeInput(schedule.startTime),
      endTime: formatTimeInput(schedule.endTime),
      slotDuration: schedule.slotDuration as 15 | 30 | 45 | 60,
      isActive: schedule.isActive,
    })

    setScheduleFormError(null)
    setActionError(null)
    setActionSuccess(null)
    setIsScheduleFormOpen(true)
  }

  const closeScheduleForm = () => {
    if (isScheduleSaving) return

    setIsScheduleFormOpen(false)
    setEditingSchedule(null)
    setScheduleFormError(null)
  }

  const openCreateExceptionForm = () => {
    setEditingException(null)

    setExceptionFormValues({
      ...defaultExceptionFormValues,
      date: new Date().toISOString().slice(0, 10),
    })

    setExceptionFormError(null)
    setActionError(null)
    setActionSuccess(null)
    setIsExceptionFormOpen(true)
  }

  const openEditExceptionForm = (
    exception: AvailabilityException,
  ) => {
    setEditingException(exception)

    setExceptionFormValues({
      date: exception.date,
      isFullDay:
        exception.startTime === null &&
        exception.endTime === null,
      startTime: exception.startTime
        ? formatTimeInput(exception.startTime)
        : "09:00",
      endTime: exception.endTime
        ? formatTimeInput(exception.endTime)
        : "17:00",
      reason: exception.reason ?? "",
    })

    setExceptionFormError(null)
    setActionError(null)
    setActionSuccess(null)
    setIsExceptionFormOpen(true)
  }

  const closeExceptionForm = () => {
    if (isExceptionSaving) return

    setIsExceptionFormOpen(false)
    setEditingException(null)
    setExceptionFormError(null)
  }

  async function handleScheduleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setScheduleFormError(null)
    setActionError(null)

    if (!faculty) return

    if (!scheduleFormValues.startTime || !scheduleFormValues.endTime) {
      setScheduleFormError("Start and end times are required.")
      return
    }

    if (scheduleFormValues.startTime >= scheduleFormValues.endTime) {
      setScheduleFormError(
        "End time must be later than start time.",
      )
      return
    }

    try {
      if (editingSchedule) {
        await updateScheduleMutation.mutateAsync({
          id: editingSchedule.id,
          data: {
            dayOfWeek: scheduleFormValues.dayOfWeek,
            startTime: scheduleFormValues.startTime,
            endTime: scheduleFormValues.endTime,
            slotDuration: scheduleFormValues.slotDuration,
            isActive: scheduleFormValues.isActive,
          },
        })

        setActionSuccess("Weekly schedule updated successfully.")
      } else {
        await createScheduleMutation.mutateAsync({
          facultyId: faculty.id,
          dayOfWeek: scheduleFormValues.dayOfWeek,
          startTime: scheduleFormValues.startTime,
          endTime: scheduleFormValues.endTime,
          slotDuration: scheduleFormValues.slotDuration,
          isActive: scheduleFormValues.isActive,
        })

        setActionSuccess("Weekly schedule added successfully.")
      }

      closeScheduleForm()
    } catch (error) {
      setScheduleFormError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to save this schedule. Please check for overlapping schedules and try again.",
      )
    }
  }

  async function handleExceptionSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setExceptionFormError(null)
    setActionError(null)

    if (!faculty) return

    if (!exceptionFormValues.date) {
      setExceptionFormError("Date is required.")
      return
    }

    if (
      !exceptionFormValues.isFullDay &&
      (!exceptionFormValues.startTime ||
        !exceptionFormValues.endTime)
    ) {
      setExceptionFormError(
        "Start and end times are required for a partial-day exception.",
      )
      return
    }

    if (
      !exceptionFormValues.isFullDay &&
      exceptionFormValues.startTime >= exceptionFormValues.endTime
    ) {
      setExceptionFormError(
        "End time must be later than start time.",
      )
      return
    }

    try {
      const data = {
        date: exceptionFormValues.date,
        startTime: exceptionFormValues.isFullDay
          ? null
          : exceptionFormValues.startTime,
        endTime: exceptionFormValues.isFullDay
          ? null
          : exceptionFormValues.endTime,
        reason: exceptionFormValues.reason.trim() || null,
      }

      if (editingException) {
        await updateExceptionMutation.mutateAsync({
          id: editingException.id,
          data,
        })

        setActionSuccess(
          "Availability exception updated successfully.",
        )
      } else {
        await createExceptionMutation.mutateAsync({
          facultyId: faculty.id,
          ...data,
        })

        setActionSuccess(
          "Availability exception added successfully.",
        )
      }

      closeExceptionForm()
    } catch (error) {
      setExceptionFormError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to save this exception. Please check whether another exception already exists for this date and time.",
      )
    }
  }

  function requestDeleteSchedule(schedule: AvailabilitySchedule) {
    setActionError(null)
    setActionSuccess(null)
    setDeleteTarget({
      type: "schedule",
      item: schedule,
    })
  }

  function requestDeleteException(
    exception: AvailabilityException,
  ) {
    setActionError(null)
    setActionSuccess(null)
    setDeleteTarget({
      type: "exception",
      item: exception,
    })
  }

  async function confirmDelete() {
    if (!deleteTarget || !faculty) return

    try {
      if (deleteTarget.type === "schedule") {
        await deleteScheduleMutation.mutateAsync({
          id: deleteTarget.item.id,
          facultyId: faculty.id,
        })

        setActionSuccess("Weekly schedule deleted successfully.")
      } else {
        await deleteExceptionMutation.mutateAsync({
          id: deleteTarget.item.id,
          facultyId: faculty.id,
        })

        setActionSuccess(
          "Availability exception deleted successfully.",
        )
      }

      setDeleteTarget(null)
    } catch (error) {
      setDeleteTarget(null)

      setActionError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to complete this action. Please try again.",
      )
    }
  }

  if (facultyQuery.isLoading || departmentsQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <ErrorState
          message="Unable to load faculty availability."
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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2 px-2"
          onClick={() => navigate(`${routes.admin}/faculty`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Faculty
        </Button>

        <EmptyState
          title="Faculty member not found"
          description="The requested faculty profile could not be found."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`${routes.admin}/faculty`)
              }
            >
              Back to faculty
            </Button>
          }
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-5">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2 px-2"
          onClick={() =>
            navigate(`${routes.admin}/faculty/${faculty.id}`)
          }
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Faculty profile
        </Button>

        <div className="rounded-2xl border bg-card p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">
                Availability
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {faculty.firstName} {faculty.lastName}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {department?.name ?? "Department unavailable"}{" "}
                · {faculty.employeeNumber}
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage the recurring schedule and temporary
                exceptions that determine when students can request
                appointments.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Active schedules
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {activeScheduleCount}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Exceptions
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {exceptions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-500/25 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400"
        >
          <Check
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>{actionSuccess}</p>

          <button
            type="button"
            className="ml-auto rounded-md p-1 transition-colors hover:bg-green-500/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setActionSuccess(null)}
            aria-label="Dismiss success message"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>{actionError}</p>

          <button
            type="button"
            className="ml-auto rounded-md p-1 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error message"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Weekly schedule
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Recurring hours used to generate appointment slots.
            </p>
          </div>

          <Button
            type="button"
            onClick={openCreateScheduleForm}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add schedule
          </Button>
        </div>

        {schedulesQuery.isLoading ? (
          <LoadingState />
        ) : schedulesQuery.isError ? (
          <ErrorState
            message="Unable to load this faculty member's schedules."
            onRetry={() => {
              void schedulesQuery.refetch()
            }}
          />
        ) : schedules.length === 0 ? (
          <EmptyState
            title="No weekly schedules"
            description="Add a recurring schedule so students can see appointment slots for this faculty member."
            action={
              <Button
                type="button"
                onClick={openCreateScheduleForm}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add first schedule
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="hidden border-b bg-muted/20 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[140px_1fr_160px_110px_auto] md:items-center md:gap-4">
              <span>Day</span>
              <span>Hours</span>
              <span>Duration</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>

            <div className="divide-y">
              {schedules.map((schedule) => (
                <article
                  key={schedule.id}
                  className="p-5 transition-colors duration-150 hover:bg-muted/15"
                >
                  <div className="grid gap-4 md:grid-cols-[140px_1fr_160px_110px_auto] md:items-center md:gap-4">
                    <div>
                      <p className="font-semibold">
                        {DAYS[schedule.dayOfWeek]}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground md:hidden">
                        Weekly schedule
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock3
                          className="size-4"
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <p className="font-medium">
                          {formatTime(schedule.startTime)}{" "}
                          <span className="text-muted-foreground">
                            –
                          </span>{" "}
                          {formatTime(schedule.endTime)}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Recurs every {DAYS[schedule.dayOfWeek]}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {schedule.slotDuration} minutes
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Appointment slots
                      </p>
                    </div>

                    <div>
                      <StatusPill active={schedule.isActive} />
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEditScheduleForm(schedule)
                        }
                      >
                        <Pencil
                          className="size-4"
                          aria-hidden="true"
                        />
                        <span className="hidden sm:inline">
                          Edit
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          requestDeleteSchedule(schedule)
                        }
                        disabled={isDeleting}
                      >
                        <Trash2
                          className="size-4"
                          aria-hidden="true"
                        />
                        <span className="hidden sm:inline">
                          Delete
                        </span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Availability exceptions
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Temporary full-day or partial-day blocks that override
              normal availability.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={openCreateExceptionForm}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add exception
          </Button>
        </div>

        {exceptionsQuery.isLoading ? (
          <LoadingState />
        ) : exceptionsQuery.isError ? (
          <ErrorState
            message="Unable to load this faculty member's availability exceptions."
            onRetry={() => {
              void exceptionsQuery.refetch()
            }}
          />
        ) : exceptions.length === 0 ? (
          <EmptyState
            title="No availability exceptions"
            description="Add an exception when this faculty member needs to block a date or time from the normal schedule."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={openCreateExceptionForm}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add exception
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {exceptions.map((exception) => (
              <article
                key={exception.id}
                className="rounded-2xl border bg-card p-5 transition-colors duration-150 hover:bg-muted/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <CalendarDays
                        className="size-5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {formatExceptionDate(exception.date)}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {exception.startTime
                          ? `${formatTime(
                              exception.startTime,
                            )} – ${formatTime(
                              exception.endTime ?? "",
                            )}`
                          : "Full day"}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    Exception
                  </span>
                </div>

                {exception.reason ? (
                  <div className="mt-4 rounded-xl bg-muted/40 p-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {exception.reason}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openEditExceptionForm(exception)
                    }
                  >
                    <Pencil
                      className="size-4"
                      aria-hidden="true"
                    />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      requestDeleteException(exception)
                    }
                    disabled={isDeleting}
                  >
                    <Trash2
                      className="size-4"
                      aria-hidden="true"
                    />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isScheduleFormOpen ? (
        <Modal
          title={
            editingSchedule
              ? "Edit weekly schedule"
              : "Add weekly schedule"
          }
          description="Set the recurring hours and appointment slot duration."
          onClose={closeScheduleForm}
          closeDisabled={isScheduleSaving}
        >
          <form
            onSubmit={handleScheduleSubmit}
            className="space-y-6 p-5 sm:p-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="adminDayOfWeek">Day</Label>

                <select
                  id="adminDayOfWeek"
                  value={scheduleFormValues.dayOfWeek}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      dayOfWeek: Number(event.target.value),
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="adminSlotDuration">
                  Slot duration
                </Label>

                <select
                  id="adminSlotDuration"
                  value={scheduleFormValues.slotDuration}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      slotDuration: Number(
                        event.target.value,
                      ) as 15 | 30 | 45 | 60,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {SLOT_DURATIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="adminStartTime">
                  Start time
                </Label>

                <Input
                  id="adminStartTime"
                  type="time"
                  value={scheduleFormValues.startTime}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="adminEndTime">
                  End time
                </Label>

                <Input
                  id="adminEndTime"
                  type="time"
                  value={scheduleFormValues.endTime}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-4 text-sm transition-colors hover:bg-muted/30">
              <input
                type="checkbox"
                checked={scheduleFormValues.isActive}
                onChange={(event) =>
                  setScheduleFormValues((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />

              <span>
                <span className="font-medium">
                  Schedule is active
                </span>

                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Active schedules generate appointment slots for
                  students.
                </span>
              </span>
            </label>

            {scheduleFormError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {scheduleFormError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeScheduleForm}
                disabled={isScheduleSaving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isScheduleSaving}
              >
                {isScheduleSaving
                  ? "Saving..."
                  : editingSchedule
                    ? "Save changes"
                    : "Add schedule"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isExceptionFormOpen ? (
        <Modal
          title={
            editingException
              ? "Edit availability exception"
              : "Add availability exception"
          }
          description="Temporarily block a full day or a specific time range."
          onClose={closeExceptionForm}
          closeDisabled={isExceptionSaving}
        >
          <form
            onSubmit={handleExceptionSubmit}
            className="space-y-6 p-5 sm:p-6"
          >
            <div className="grid gap-2">
              <Label htmlFor="adminExceptionDate">
                Date
              </Label>

              <Input
                id="adminExceptionDate"
                type="date"
                value={exceptionFormValues.date}
                onChange={(event) =>
                  setExceptionFormValues((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                required
              />

              {exceptionFormValues.date ? (
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(exceptionFormValues.date)}
                </p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-4 text-sm transition-colors hover:bg-muted/30">
              <input
                type="checkbox"
                checked={exceptionFormValues.isFullDay}
                onChange={(event) =>
                  setExceptionFormValues((current) => ({
                    ...current,
                    isFullDay: event.target.checked,
                  }))
                }
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />

              <span>
                <span className="font-medium">
                  Full-day exception
                </span>

                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Block all normal availability for this date.
                </span>
              </span>
            </label>

            {!exceptionFormValues.isFullDay ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="adminExceptionStartTime">
                    Start time
                  </Label>

                  <Input
                    id="adminExceptionStartTime"
                    type="time"
                    value={exceptionFormValues.startTime}
                    onChange={(event) =>
                      setExceptionFormValues((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="adminExceptionEndTime">
                    End time
                  </Label>

                  <Input
                    id="adminExceptionEndTime"
                    type="time"
                    value={exceptionFormValues.endTime}
                    onChange={(event) =>
                      setExceptionFormValues((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="adminExceptionReason">
                Reason
              </Label>

              <Input
                id="adminExceptionReason"
                value={exceptionFormValues.reason}
                onChange={(event) =>
                  setExceptionFormValues((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Optional"
                maxLength={500}
              />

              <p className="text-xs text-muted-foreground">
                Add a short note if the exception needs context.
              </p>
            </div>

            {exceptionFormError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {exceptionFormError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeExceptionForm}
                disabled={isExceptionSaving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isExceptionSaving}
              >
                {isExceptionSaving
                  ? "Saving..."
                  : editingException
                    ? "Save changes"
                    : "Add exception"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal
          title={
            deleteTarget.type === "schedule"
              ? "Delete weekly schedule?"
              : "Delete availability exception?"
          }
          description="This action cannot be undone."
          onClose={() => {
            if (!isDeleting) {
              setDeleteTarget(null)
            }
          }}
          closeDisabled={isDeleting}
          maxWidth="max-w-md"
        >
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 text-sm">
                {deleteTarget.type === "schedule" ? (
                  <>
                    <p className="font-medium">
                      {DAYS[deleteTarget.item.dayOfWeek]}{" "}
                      schedule
                    </p>

                    <p className="mt-1 leading-5 text-muted-foreground">
                      {formatTime(
                        deleteTarget.item.startTime,
                      )}{" "}
                      –{" "}
                      {formatTime(
                        deleteTarget.item.endTime,
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      {formatExceptionDate(
                        deleteTarget.item.date,
                      )}
                    </p>

                    <p className="mt-1 leading-5 text-muted-foreground">
                      {deleteTarget.item.startTime
                        ? `${formatTime(
                            deleteTarget.item.startTime,
                          )} – ${formatTime(
                            deleteTarget.item.endTime ?? "",
                          )}`
                        : "Full day"}
                    </p>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {deleteTarget.type === "schedule"
                ? "Students will no longer receive appointment slots generated by this recurring schedule."
                : "The normal weekly schedule will apply to this date again unless another exception exists."}
            </p>

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2
                      className="size-4"
                      aria-hidden="true"
                    />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  )
}

function formatTimeInput(time: string) {
  return time.slice(0, 5)
}
