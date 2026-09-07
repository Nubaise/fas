import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

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

function formatExceptionDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString()
}

export function FacultyAvailabilityPage() {
  const { user } = useAuth()

  const [isScheduleFormOpen, setIsScheduleFormOpen] =
    useState(false)

  const [editingSchedule, setEditingSchedule] =
    useState<AvailabilitySchedule | null>(null)

  const [scheduleFormValues, setScheduleFormValues] =
    useState<ScheduleFormValues>(defaultScheduleFormValues)

  const [scheduleFormError, setScheduleFormError] =
    useState<string | null>(null)

  const [isExceptionFormOpen, setIsExceptionFormOpen] =
    useState(false)

  const [editingException, setEditingException] =
    useState<AvailabilityException | null>(null)

  const [exceptionFormValues, setExceptionFormValues] =
    useState<ExceptionFormValues>(defaultExceptionFormValues)

  const [exceptionFormError, setExceptionFormError] =
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

  const schedules = schedulesQuery.data ?? []
  const exceptions = exceptionsQuery.data ?? []

  function openCreateScheduleForm() {
    setEditingSchedule(null)
    setScheduleFormValues(defaultScheduleFormValues)
    setScheduleFormError(null)
    setIsScheduleFormOpen(true)
  }

  function openEditScheduleForm(
    schedule: AvailabilitySchedule,
  ) {
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
    setIsScheduleFormOpen(true)
  }

  function closeScheduleForm() {
    if (isScheduleSaving) {
      return
    }

    setIsScheduleFormOpen(false)
    setEditingSchedule(null)
    setScheduleFormError(null)
  }

  function openCreateExceptionForm() {
    setEditingException(null)

    setExceptionFormValues({
      ...defaultExceptionFormValues,
      date: new Date().toISOString().slice(0, 10),
    })

    setExceptionFormError(null)
    setIsExceptionFormOpen(true)
  }

  function openEditExceptionForm(
    exception: AvailabilityException,
  ) {
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
    setIsExceptionFormOpen(true)
  }

  function closeExceptionForm() {
    if (isExceptionSaving) {
      return
    }

    setIsExceptionFormOpen(false)
    setEditingException(null)
    setExceptionFormError(null)
  }

  async function handleScheduleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setScheduleFormError(null)

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
      } else {
        await createScheduleMutation.mutateAsync({
          facultyId: faculty.id,
          dayOfWeek: scheduleFormValues.dayOfWeek,
          startTime: scheduleFormValues.startTime,
          endTime: scheduleFormValues.endTime,
          slotDuration: scheduleFormValues.slotDuration,
          isActive: scheduleFormValues.isActive,
        })
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
      } else {
        await createExceptionMutation.mutateAsync({
          facultyId: faculty.id,
          ...data,
        })
      }

      closeExceptionForm()
    } catch {
      setExceptionFormError(
        "Unable to save this exception. Please check whether another exception already exists for this date and time.",
      )
    }
  }

  async function handleDeleteSchedule(
    schedule: AvailabilitySchedule,
  ) {
    const confirmed = window.confirm(
      `Delete the ${DAYS[schedule.dayOfWeek]} schedule from ${formatTime(
        schedule.startTime,
      )} to ${formatTime(schedule.endTime)}?`,
    )

    if (!confirmed || !faculty) {
      return
    }

    try {
      await deleteScheduleMutation.mutateAsync({
        id: schedule.id,
        facultyId: faculty.id,
      })
    } catch {
      window.alert(
        "Unable to delete this schedule. Please try again.",
      )
    }
  }

  async function handleDeleteException(
    exception: AvailabilityException,
  ) {
    const description = exception.startTime
      ? `${formatExceptionDate(exception.date)} from ${formatTime(
          exception.startTime,
        )} to ${formatTime(exception.endTime ?? "")}`
      : `${formatExceptionDate(exception.date)} for the full day`

    const confirmed = window.confirm(
      `Delete the availability exception for ${description}?`,
    )

    if (!confirmed || !faculty) {
      return
    }

    try {
      await deleteExceptionMutation.mutateAsync({
        id: exception.id,
        facultyId: faculty.id,
      })
    } catch {
      window.alert(
        "Unable to delete this exception. Please try again.",
      )
    }
  }

  if (facultyQuery.isLoading) {
    return <LoadingState />
  }

  if (facultyQuery.isError) {
    return (
      <ErrorState message="Unable to load your faculty profile." />
    )
  }

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Faculty Portal
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Availability
          </h1>

          <p className="text-muted-foreground">
            No faculty profile is associated with your account.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Faculty Portal
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Availability
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Configure your weekly availability and manage dates
            when you are unavailable.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">
              Weekly schedules
            </h2>

            <p className="text-sm text-muted-foreground">
              Active schedules generate appointment slots for
              students.
            </p>
          </div>

          <Button onClick={openCreateScheduleForm}>
            <Plus className="mr-2 size-4" />
            Add schedule
          </Button>
        </div>

        {schedulesQuery.isLoading && <LoadingState />}

        {schedulesQuery.isError && (
          <ErrorState message="Unable to load your availability schedules." />
        )}

        {!schedulesQuery.isLoading &&
          !schedulesQuery.isError &&
          schedules.length === 0 && (
            <section className="rounded-xl border border-dashed p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                <Plus className="size-5" />
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No availability schedules
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Add a weekly schedule so students can see your
                available appointment slots.
              </p>

              <Button
                className="mt-5"
                onClick={openCreateScheduleForm}
              >
                Add your first schedule
              </Button>
            </section>
          )}

        {!schedulesQuery.isLoading &&
          !schedulesQuery.isError &&
          schedules.length > 0 && (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <article
                  key={schedule.id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {DAYS[schedule.dayOfWeek]}
                        </h3>

                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                          {schedule.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {formatTime(schedule.startTime)} –{" "}
                        {formatTime(schedule.endTime)}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {schedule.slotDuration}-minute
                        appointments
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEditScheduleForm(schedule)
                        }
                      >
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteSchedule(schedule)
                        }
                        disabled={
                          deleteScheduleMutation.isPending
                        }
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        {isScheduleFormOpen && (
          <section className="rounded-xl border p-6">
            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-semibold">
                {editingSchedule
                  ? "Edit availability"
                  : "Add availability"}
              </h3>

              <p className="text-sm text-muted-foreground">
                Set when students can request appointments.
              </p>
            </div>

            <form
              onSubmit={handleScheduleSubmit}
              className="space-y-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day</Label>

                  <select
                    id="dayOfWeek"
                    value={scheduleFormValues.dayOfWeek}
                    onChange={(event) =>
                      setScheduleFormValues((current) => ({
                        ...current,
                        dayOfWeek: Number(event.target.value),
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slotDuration">
                    Slot duration
                  </Label>

                  <select
                    id="slotDuration"
                    value={scheduleFormValues.slotDuration}
                    onChange={(event) =>
                      setScheduleFormValues((current) => ({
                        ...current,
                        slotDuration: Number(
                          event.target.value,
                        ) as 15 | 30 | 45 | 60,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SLOT_DURATIONS.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} minutes
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Start time
                  </Label>

                  <Input
                    id="startTime"
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
                  <Label htmlFor="endTime">End time</Label>

                  <Input
                    id="endTime"
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

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={scheduleFormValues.isActive}
                  onChange={(event) =>
                    setScheduleFormValues((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="size-4"
                />

                <span>
                  <span className="font-medium">
                    Schedule is active
                  </span>

                  <span className="block text-muted-foreground">
                    Active schedules generate appointment slots
                    for students.
                  </span>
                </span>
              </label>

              {scheduleFormError && (
                <p className="text-sm text-destructive">
                  {scheduleFormError}
                </p>
              )}

              <div className="flex justify-end gap-2">
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
          </section>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">
              Availability exceptions
            </h2>

            <p className="text-sm text-muted-foreground">
              Block a full day or a specific time range from your
              normal availability.
            </p>
          </div>

          <Button onClick={openCreateExceptionForm}>
            <Plus className="mr-2 size-4" />
            Add exception
          </Button>
        </div>

        {exceptionsQuery.isLoading && <LoadingState />}

        {exceptionsQuery.isError && (
          <ErrorState message="Unable to load your availability exceptions." />
        )}

        {!exceptionsQuery.isLoading &&
          !exceptionsQuery.isError &&
          exceptions.length === 0 && (
            <section className="rounded-xl border border-dashed p-8 text-center">
              <h3 className="text-lg font-semibold">
                No availability exceptions
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Add an exception when you need to block a date or
                time from your normal schedule.
              </p>

              <Button
                className="mt-5"
                variant="outline"
                onClick={openCreateExceptionForm}
              >
                Add exception
              </Button>
            </section>
          )}

        {!exceptionsQuery.isLoading &&
          !exceptionsQuery.isError &&
          exceptions.length > 0 && (
            <div className="space-y-3">
              {exceptions.map((exception) => (
                <article
                  key={exception.id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold">
                        {formatExceptionDate(exception.date)}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {exception.startTime
                          ? `${formatTime(
                              exception.startTime,
                            )} – ${formatTime(
                              exception.endTime ?? "",
                            )}`
                          : "Full day"}
                      </p>

                      {exception.reason && (
                        <p className="text-sm text-muted-foreground">
                          {exception.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEditExceptionForm(exception)
                        }
                      >
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteException(exception)
                        }
                        disabled={
                          deleteExceptionMutation.isPending
                        }
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        {isExceptionFormOpen && (
          <section className="rounded-xl border p-6">
            <div className="mb-6 space-y-1">
              <h3 className="text-lg font-semibold">
                {editingException
                  ? "Edit exception"
                  : "Add exception"}
              </h3>

              <p className="text-sm text-muted-foreground">
                Temporarily block availability from your normal
                schedule.
              </p>
            </div>

            <form
              onSubmit={handleExceptionSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="exceptionDate">
                  Date
                </Label>

                <Input
                  id="exceptionDate"
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

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={exceptionFormValues.isFullDay}
                  onChange={(event) =>
                    setExceptionFormValues((current) => ({
                      ...current,
                      isFullDay: event.target.checked,
                    }))
                  }
                  className="size-4"
                />

                <span>
                  <span className="font-medium">
                    Full-day exception
                  </span>

                  <span className="block text-muted-foreground">
                    Block your entire availability for this date.
                  </span>
                </span>
              </label>

              {!exceptionFormValues.isFullDay && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="exceptionStartTime">
                      Start time
                    </Label>

                    <Input
                      id="exceptionStartTime"
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
                    <Label htmlFor="exceptionEndTime">
                      End time
                    </Label>

                    <Input
                      id="exceptionEndTime"
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
              )}

              <div className="space-y-2">
                <Label htmlFor="exceptionReason">
                  Reason
                </Label>

                <Input
                  id="exceptionReason"
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

              {exceptionFormError && (
                <p className="text-sm text-destructive">
                  {exceptionFormError}
                </p>
              )}

              <div className="flex justify-end gap-2">
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
          </section>
        )}
      </section>
    </main>
  )
}
