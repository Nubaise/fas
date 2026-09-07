import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useAuth } from "@/features/auth/AuthProvider"
import { useFacultyQuery } from "@/features/faculty/faculty-queries"
import {
  useCreateAvailabilityScheduleMutation,
  useDeleteAvailabilityScheduleMutation,
  useFacultySchedulesQuery,
  useUpdateAvailabilityScheduleMutation,
} from "./availability-queries"
import {
  useCreateAvailabilityExceptionMutation,
  useDeleteAvailabilityExceptionMutation,
  useFacultyExceptionsQuery,
  useUpdateAvailabilityExceptionMutation,
} from "./availability-exception-queries"
import type { AvailabilitySchedule } from "./availability.types"
import type { AvailabilityException } from "./availability-exception-api"

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
  return time.slice(0, 5)
}

function formatDisplayTime(time: string) {
  const [hours, minutes] = formatTime(time).split(":")
  const hour = Number(hours)

  return new Date(
    1970,
    0,
    1,
    hour,
    Number(minutes),
  ).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
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

function sortSchedules(
  schedules: AvailabilitySchedule[],
) {
  return [...schedules].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek
    }

    return a.startTime.localeCompare(b.startTime)
  })
}

function sortExceptions(
  exceptions: AvailabilityException[],
) {
  return [...exceptions].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
}

function Modal({
  title,
  description,
  children,
  onClose,
  busy,
}: {
  title: string
  description: string
  children: React.ReactNode
  onClose: () => void
  busy: boolean
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-modal-title"
        className="max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-t-2xl border bg-card shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-card px-6 py-5 sm:px-7">
          <div>
            <h2
              id="availability-modal-title"
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {children}
      </div>
    </div>
  )
}

export function FacultyAvailabilityPage() {
  const { user } = useAuth()

  const [scheduleFormOpen, setScheduleFormOpen] =
    useState(false)

  const [editingSchedule, setEditingSchedule] =
    useState<AvailabilitySchedule | null>(null)

  const [scheduleFormValues, setScheduleFormValues] =
    useState<ScheduleFormValues>(defaultScheduleFormValues)

  const [scheduleFormError, setScheduleFormError] =
    useState<string | null>(null)

  const [exceptionFormOpen, setExceptionFormOpen] =
    useState(false)

  const [editingException, setEditingException] =
    useState<AvailabilityException | null>(null)

  const [exceptionFormValues, setExceptionFormValues] =
    useState<ExceptionFormValues>(defaultExceptionFormValues)

  const [exceptionFormError, setExceptionFormError] =
    useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget>(null)

  const [actionError, setActionError] =
    useState<string | null>(null)

  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null)

  const facultyQuery = useFacultyQuery()

  const faculty = useMemo(
    () => facultyQuery.data?.find((item) => item.userId === user?.id),
    [facultyQuery.data, user?.id],
  )

  const schedulesQuery = useFacultySchedulesQuery(
    faculty?.id ?? "",
  )

  const exceptionsQuery = useFacultyExceptionsQuery(
    faculty?.id ?? "",
  )

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
    () => sortSchedules(schedulesQuery.data ?? []),
    [schedulesQuery.data],
  )

  const exceptions = useMemo(
    () => sortExceptions(exceptionsQuery.data ?? []),
    [exceptionsQuery.data],
  )

  const activeSchedules = schedules.filter(
    (schedule) => schedule.isActive,
  ).length

  function clearFeedback() {
    setActionError(null)
    setActionSuccess(null)
  }

  function openCreateScheduleForm() {
    clearFeedback()
    setEditingSchedule(null)
    setScheduleFormValues({
      ...defaultScheduleFormValues,
    })
    setScheduleFormError(null)
    setScheduleFormOpen(true)
  }

  function openEditScheduleForm(
    schedule: AvailabilitySchedule,
  ) {
    clearFeedback()
    setEditingSchedule(schedule)

    setScheduleFormValues({
      dayOfWeek: schedule.dayOfWeek,
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
      slotDuration: schedule.slotDuration as
        | 15
        | 30
        | 45
        | 60,
      isActive: schedule.isActive,
    })

    setScheduleFormError(null)
    setScheduleFormOpen(true)
  }

  function closeScheduleForm() {
    if (isScheduleSaving) {
      return
    }

    setScheduleFormOpen(false)
    setEditingSchedule(null)
    setScheduleFormError(null)
  }

  function openCreateExceptionForm() {
    clearFeedback()
    setEditingException(null)

    setExceptionFormValues({
      ...defaultExceptionFormValues,
      date: new Date().toISOString().slice(0, 10),
    })

    setExceptionFormError(null)
    setExceptionFormOpen(true)
  }

  function openEditExceptionForm(
    exception: AvailabilityException,
  ) {
    clearFeedback()
    setEditingException(exception)

    setExceptionFormValues({
      date: exception.date,
      isFullDay:
        exception.startTime === null &&
        exception.endTime === null,
      startTime: exception.startTime
        ? formatTime(exception.startTime)
        : "09:00",
      endTime: exception.endTime
        ? formatTime(exception.endTime)
        : "17:00",
      reason: exception.reason ?? "",
    })

    setExceptionFormError(null)
    setExceptionFormOpen(true)
  }

  function closeExceptionForm() {
    if (isExceptionSaving) {
      return
    }

    setExceptionFormOpen(false)
    setEditingException(null)
    setExceptionFormError(null)
  }

  async function handleScheduleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setScheduleFormError(null)
    clearFeedback()

    if (!faculty) {
      return
    }

    if (
      !scheduleFormValues.startTime ||
      !scheduleFormValues.endTime
    ) {
      setScheduleFormError(
        "Start and end times are required.",
      )
      return
    }

    if (
      scheduleFormValues.startTime >=
      scheduleFormValues.endTime
    ) {
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

        setActionSuccess("Availability schedule updated.")
      } else {
        await createScheduleMutation.mutateAsync({
          facultyId: faculty.id,
          dayOfWeek: scheduleFormValues.dayOfWeek,
          startTime: scheduleFormValues.startTime,
          endTime: scheduleFormValues.endTime,
          slotDuration: scheduleFormValues.slotDuration,
          isActive: scheduleFormValues.isActive,
        })

        setActionSuccess("Availability schedule added.")
      }

      closeScheduleForm()
    } catch {
      setScheduleFormError(
        "Unable to save this schedule. Please check for overlapping schedules and try again.",
      )
    }
  }

  async function handleExceptionSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setExceptionFormError(null)
    clearFeedback()

    if (!faculty) {
      return
    }

    if (!exceptionFormValues.date) {
      setExceptionFormError("Date is required.")
      return
    }

    if (
      !exceptionFormValues.isFullDay &&
      (
        !exceptionFormValues.startTime ||
        !exceptionFormValues.endTime
      )
    ) {
      setExceptionFormError(
        "Start and end times are required for a partial-day exception.",
      )
      return
    }

    if (
      !exceptionFormValues.isFullDay &&
      exceptionFormValues.startTime >=
        exceptionFormValues.endTime
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
        reason:
          exceptionFormValues.reason.trim() || null,
      }

      if (editingException) {
        await updateExceptionMutation.mutateAsync({
          id: editingException.id,
          data,
        })

        setActionSuccess("Availability exception updated.")
      } else {
        await createExceptionMutation.mutateAsync({
          facultyId: faculty.id,
          ...data,
        })

        setActionSuccess("Availability exception added.")
      }

      closeExceptionForm()
    } catch {
      setExceptionFormError(
        "Unable to save this exception. Please check whether another exception already exists for this date and time.",
      )
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !faculty) {
      return
    }

    clearFeedback()

    try {
      if (deleteTarget.type === "schedule") {
        await deleteScheduleMutation.mutateAsync({
          id: deleteTarget.item.id,
          facultyId: faculty.id,
        })

        setActionSuccess("Availability schedule deleted.")
      } else {
        await deleteExceptionMutation.mutateAsync({
          id: deleteTarget.item.id,
          facultyId: faculty.id,
        })

        setActionSuccess("Availability exception deleted.")
      }

      setDeleteTarget(null)
    } catch {
      setActionError(
        deleteTarget.type === "schedule"
          ? "Unable to delete this schedule. Please try again."
          : "Unable to delete this exception. Please try again.",
      )
    }
  }

  if (facultyQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (facultyQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <ErrorState
          message="Unable to load your faculty profile."
          onRetry={() => facultyQuery.refetch()}
        />
      </main>
    )
  }

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="rounded-2xl border border-dashed p-8">
          <p className="text-sm font-medium text-primary">
            Faculty portal
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Availability
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            No faculty profile is associated with your account.
          </p>
        </section>
      </main>
    )
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">
              Faculty portal
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Availability
            </h1>

            <p className="max-w-2xl text-muted-foreground">
              Set your recurring schedule and block specific dates
              or times when you are unavailable.
            </p>
          </div>
        </section>

        {actionError ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <X
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <span>{actionError}</span>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
            >
              <X className="size-3" aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        {actionSuccess ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
          >
            <CheckCircle2
              className="size-4 shrink-0"
              aria-hidden="true"
            />

            <span>{actionSuccess}</span>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="ml-auto text-green-700 hover:text-green-700 dark:text-green-400 dark:hover:text-green-400"
              onClick={() => setActionSuccess(null)}
              aria-label="Dismiss success message"
            >
              <X className="size-3" aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />

                <h2 className="text-xl font-semibold tracking-tight">
                  Weekly schedule
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {activeSchedules} active{" "}
                {activeSchedules === 1
                  ? "schedule"
                  : "schedules"}{" "}
                currently generating student slots.
              </p>
            </div>

            <Button onClick={openCreateScheduleForm}>
              <Plus className="size-4" />
              Add schedule
            </Button>
          </div>

          {schedulesQuery.isPending ? (
            <LoadingState />
          ) : schedulesQuery.isError ? (
            <ErrorState
              message="Unable to load your availability schedules."
              onRetry={() => schedulesQuery.refetch()}
            />
          ) : schedules.length === 0 ? (
            <section className="rounded-2xl border border-dashed p-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-4 font-semibold">
                No weekly schedule yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Add your first recurring schedule so students can
                see appointment slots.
              </p>

              <Button
                className="mt-6"
                onClick={openCreateScheduleForm}
              >
                Add your first schedule
              </Button>
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="divide-y">
                {schedules.map((schedule) => (
                  <article
                    key={schedule.id}
                    className="group p-5 transition-colors hover:bg-muted/30 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <CalendarDays
                            className="size-5"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {DAYS[schedule.dayOfWeek]}
                            </h3>

                            <span
                              className={
                                schedule.isActive
                                  ? "rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400"
                                  : "rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                              }
                            >
                              {schedule.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {formatDisplayTime(
                                schedule.startTime,
                              )}{" "}
                              –{" "}
                              {formatDisplayTime(
                                schedule.endTime,
                              )}
                            </span>

                            <span>
                              {schedule.slotDuration}-minute
                              slots
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openEditScheduleForm(schedule)
                          }
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              type: "schedule",
                              item: schedule,
                            })
                          }
                          disabled={isDeleting}
                        >
                          <Trash2 className="size-4" />
                          Delete
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock3
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />

                <h2 className="text-xl font-semibold tracking-tight">
                  Availability exceptions
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Block a full day or a specific period from your
                normal schedule.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={openCreateExceptionForm}
            >
              <Plus className="size-4" />
              Add exception
            </Button>
          </div>

          {exceptionsQuery.isPending ? (
            <LoadingState />
          ) : exceptionsQuery.isError ? (
            <ErrorState
              message="Unable to load your availability exceptions."
              onRetry={() => exceptionsQuery.refetch()}
            />
          ) : exceptions.length === 0 ? (
            <section className="rounded-2xl border border-dashed p-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                <Clock3
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-4 font-semibold">
                No exceptions
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Your normal weekly availability has no blocked
                dates or times.
              </p>

              <Button
                className="mt-6"
                variant="outline"
                onClick={openCreateExceptionForm}
              >
                Add an exception
              </Button>
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="divide-y">
                {exceptions.map((exception) => (
                  <article
                    key={exception.id}
                    className="p-5 transition-colors hover:bg-muted/30 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Clock3
                            className="size-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold">
                            {formatShortDate(exception.date)}
                          </h3>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {exception.startTime
                              ? `${formatDisplayTime(
                                  exception.startTime,
                                )} – ${formatDisplayTime(
                                  exception.endTime ?? "",
                                )}`
                              : "Full day"}
                          </p>

                          {exception.reason ? (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {exception.reason}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2 lg:shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openEditExceptionForm(exception)
                          }
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              type: "exception",
                              item: exception,
                            })
                          }
                          disabled={isDeleting}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {scheduleFormOpen ? (
        <Modal
          title={
            editingSchedule
              ? "Edit availability"
              : "Add availability"
          }
          description="Set when students can request appointments."
          onClose={closeScheduleForm}
          busy={isScheduleSaving}
        >
          <form
            onSubmit={handleScheduleSubmit}
            className="space-y-6 p-6 sm:p-7"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-day">
                  Day
                </Label>

                <select
                  id="schedule-day"
                  value={scheduleFormValues.dayOfWeek}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      dayOfWeek: Number(event.target.value),
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-duration">
                  Slot duration
                </Label>

                <select
                  id="schedule-duration"
                  value={scheduleFormValues.slotDuration}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      slotDuration: Number(
                        event.target.value,
                      ) as 15 | 30 | 45 | 60,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {SLOT_DURATIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-start">
                  Start time
                </Label>

                <Input
                  id="schedule-start"
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

              <div className="space-y-2">
                <Label htmlFor="schedule-end">
                  End time
                </Label>

                <Input
                  id="schedule-end"
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

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40">
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

              <span className="space-y-1">
                <span className="block text-sm font-medium">
                  Schedule is active
                </span>

                <span className="block text-xs leading-5 text-muted-foreground">
                  Active schedules generate appointment slots
                  for students.
                </span>
              </span>
            </label>

            {scheduleFormError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
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
                  ? "Saving changes..."
                  : editingSchedule
                    ? "Save changes"
                    : "Add schedule"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {exceptionFormOpen ? (
        <Modal
          title={
            editingException
              ? "Edit exception"
              : "Add exception"
          }
          description="Temporarily block availability from your normal schedule."
          onClose={closeExceptionForm}
          busy={isExceptionSaving}
        >
          <form
            onSubmit={handleExceptionSubmit}
            className="space-y-6 p-6 sm:p-7"
          >
            <div className="space-y-2">
              <Label htmlFor="exception-date">
                Date
              </Label>

              <Input
                id="exception-date"
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
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40">
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

              <span className="space-y-1">
                <span className="block text-sm font-medium">
                  Full-day exception
                </span>

                <span className="block text-xs leading-5 text-muted-foreground">
                  Block your entire availability for this date.
                </span>
              </span>
            </label>

            {!exceptionFormValues.isFullDay ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="exception-start">
                    Start time
                  </Label>

                  <Input
                    id="exception-start"
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

                <div className="space-y-2">
                  <Label htmlFor="exception-end">
                    End time
                  </Label>

                  <Input
                    id="exception-end"
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

            <div className="space-y-2">
              <Label htmlFor="exception-reason">
                Reason
              </Label>

              <Input
                id="exception-reason"
                value={exceptionFormValues.reason}
                onChange={(event) =>
                  setExceptionFormValues((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>

            {exceptionFormError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
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
                  ? "Saving changes..."
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
              ? "Delete availability schedule?"
              : "Delete availability exception?"
          }
          description="This action cannot be undone."
          onClose={() => {
            if (!isDeleting) {
              setDeleteTarget(null)
            }
          }}
          busy={isDeleting}
        >
          <div className="space-y-6 p-6 sm:p-7">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm leading-6">
                {deleteTarget.type === "schedule" ? (
                  <>
                    Delete the{" "}
                    <strong>
                      {DAYS[
                        deleteTarget.item.dayOfWeek
                      ]
                      }
                    </strong>{" "}
                    schedule from{" "}
                    <strong>
                      {formatDisplayTime(
                        deleteTarget.item.startTime,
                      )}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {formatDisplayTime(
                        deleteTarget.item.endTime,
                      )}
                    </strong>
                    ?
                  </>
                ) : (
                  <>
                    Delete the availability exception for{" "}
                    <strong>
                      {formatExceptionDate(
                        deleteTarget.item.date,
                      )}
                    </strong>
                    ?
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />

                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
