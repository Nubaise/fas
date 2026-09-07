import {
  CheckCircle2,
  Info,
  LockKeyhole,
  UserRound,
} from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/AuthProvider"
import {
  useDepartmentsQuery,
  useFacultyQuery,
  useUpdateFacultyMutation,
} from "./faculty-queries"

type ProfileFormValues = {
  firstName: string
  lastName: string
}

type ManagedFieldProps = {
  label: string
  value: string
  description: string
  id: string
}

function ManagedField({
  label,
  value,
  description,
  id,
}: ManagedFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        value={value}
        disabled
        aria-describedby={`${id}-help`}
      />

      <p
        id={`${id}-help`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <LockKeyhole
          className="size-3 shrink-0"
          aria-hidden="true"
        />
        {description}
      </p>
    </div>
  )
}

export function FacultyProfilePage() {
  const { user } = useAuth()

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()
  const updateMutation = useUpdateFacultyMutation()

  const faculty = useMemo(
    () =>
      facultyQuery.data?.find(
        (item) => item.userId === user?.id,
      ),
    [facultyQuery.data, user?.id],
  )

  const department = useMemo(
    () =>
      departmentsQuery.data?.find(
        (item) => item.id === faculty?.departmentId,
      ),
    [departmentsQuery.data, faculty?.departmentId],
  )

  const form = useForm<ProfileFormValues>({
    values: {
      firstName: faculty?.firstName ?? "",
      lastName: faculty?.lastName ?? "",
    },
  })

  if (
    facultyQuery.isPending ||
    departmentsQuery.isPending
  ) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (
    facultyQuery.isError ||
    departmentsQuery.isError
  ) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <ErrorState
          message="Unable to load your faculty profile."
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
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
        <section className="rounded-2xl border border-dashed bg-card p-8">
          <p className="text-sm font-medium text-primary">
            Faculty portal
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Profile not found
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            No faculty profile is associated with your account.
          </p>
        </section>
      </main>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      id: faculty.id,
      data: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      },
    })

    form.reset({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    })
  })

  const firstNameError = form.formState.errors.firstName
  const lastNameError = form.formState.errors.lastName
  const hasChanges = form.formState.isDirty

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">
          Faculty portal
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your profile
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Manage the personal information available for you to
          update from the faculty portal.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/15 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold tracking-tight">
                Personal information
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Update your first and last name. Faculty
                information managed by administration is shown
                below.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-5 sm:p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First name
                </Label>

                <Input
                  id="firstName"
                  autoComplete="given-name"
                  {...form.register("firstName", {
                    required: "First name is required",
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "First name is required",
                  })}
                  aria-invalid={Boolean(firstNameError)}
                />

                {firstNameError ? (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {firstNameError.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last name
                </Label>

                <Input
                  id="lastName"
                  autoComplete="family-name"
                  {...form.register("lastName", {
                    required: "Last name is required",
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "Last name is required",
                  })}
                  aria-invalid={Boolean(lastNameError)}
                />

                {lastNameError ? (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {lastNameError.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <LockKeyhole
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-medium">
                  Administration-managed information
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  These details are controlled by administration
                  and cannot be changed from the faculty portal.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <ManagedField
                id="employeeNumber"
                label="Employee number"
                value={faculty.employeeNumber}
                description="Managed by administration."
              />

              <ManagedField
                id="department"
                label="Department"
                value={
                  department
                    ? `${department.name} (${department.code})`
                    : "Unknown department"
                }
                description="Managed by administration."
              />
            </div>
          </div>

          <div className="border-t bg-muted/10 px-5 py-5 sm:px-6">
            {updateMutation.isError ? (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
              >
                <Info
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <p className="font-medium">
                    Unable to save changes
                  </p>

                  <p className="mt-1 text-destructive/80">
                    Please check your information and try again.
                  </p>
                </div>
              </div>
            ) : null}

            {updateMutation.isSuccess && !hasChanges ? (
              <div
                role="status"
                className="mb-5 flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
              >
                <CheckCircle2
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />

                <span>
                  Your profile was updated successfully.
                </span>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Only your first and last name can be changed
                  here.
                </p>

                {hasChanges ? (
                  <p className="mt-1 text-xs text-primary">
                    You have unsaved changes.
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={
                  updateMutation.isPending || !hasChanges
                }
                className="w-full sm:w-auto"
              >
                {updateMutation.isPending
                  ? "Saving changes..."
                  : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}
