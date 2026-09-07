import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Loader2,
} from "lucide-react"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useDepartmentsQuery,
  useFacultyQuery,
  useOnboardFacultyMutation,
  useUpdateFacultyMutation,
} from "@/features/faculty/faculty-queries"

const facultyFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),
  employeeNumber: z
    .string()
    .trim()
    .min(1, "Employee number is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  departmentId: z.string().uuid("Select a department"),
})

type FacultyFormInput = z.input<typeof facultyFormSchema>
type FacultyFormValues = z.output<typeof facultyFormSchema>

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-5">{children}</div>
    </section>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function AdminFacultyFormPage() {
  const navigate = useNavigate()
  const { facultyId } = useParams()

  const isEditMode = Boolean(facultyId)

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  const onboardFacultyMutation = useOnboardFacultyMutation()
  const updateFacultyMutation = useUpdateFacultyMutation()

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<FacultyFormInput, unknown, FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      email: "",
      password: "",
      employeeNumber: "",
      firstName: "",
      lastName: "",
      departmentId: "",
    },
  })

  const selectedDepartmentId = watch("departmentId")

  useEffect(() => {
    if (!isEditMode || !facultyId || !facultyQuery.data) {
      return
    }

    const faculty = facultyQuery.data.find(
      (item) => item.id === facultyId,
    )

    if (!faculty) {
      return
    }

    reset({
      email: "",
      password: "",
      employeeNumber: faculty.employeeNumber,
      firstName: faculty.firstName,
      lastName: faculty.lastName,
      departmentId: faculty.departmentId,
    })
  }, [
    isEditMode,
    facultyId,
    facultyQuery.data,
    reset,
  ])

  if (
    departmentsQuery.isLoading ||
    (isEditMode && facultyQuery.isLoading)
  ) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (departmentsQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <ErrorState
          message="Unable to load the department list."
          onRetry={() => {
            void departmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  if (isEditMode && facultyQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <ErrorState
          message="Unable to load the faculty profile."
          onRetry={() => {
            void facultyQuery.refetch()
          }}
        />
      </main>
    )
  }

  const departments = departmentsQuery.data ?? []

  const faculty = facultyQuery.data?.find(
    (item) => item.id === facultyId,
  )

  if (isEditMode && !faculty) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <GraduationCap
              className="size-6"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-5 text-lg font-semibold tracking-tight">
            Faculty member not found
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The faculty profile you are trying to edit could not be
            found.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => navigate("/admin/faculty")}
          >
            Back to faculty
          </Button>
        </div>
      </main>
    )
  }

  async function onSubmit(data: FacultyFormValues) {
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      if (isEditMode && facultyId) {
        await updateFacultyMutation.mutateAsync({
          id: facultyId,
          data: {
            employeeNumber: data.employeeNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            departmentId: data.departmentId,
          },
        })
      } else {
        await onboardFacultyMutation.mutateAsync({
          email: data.email,
          password: data.password,
          employeeNumber: data.employeeNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: data.departmentId,
        })
      }

      setSubmitSuccess(true)

      window.setTimeout(() => {
        navigate("/admin/faculty")
      }, 500)
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message)
      } else {
        setSubmitError(
          isEditMode
            ? "Unable to update faculty. Please try again."
            : "Unable to create faculty. Please try again.",
        )
      }
    }
  }

  const isSubmitting =
    onboardFacultyMutation.isPending ||
    updateFacultyMutation.isPending

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <section className="space-y-5">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2 px-2"
          onClick={() => navigate("/admin/faculty")}
          disabled={isSubmitting}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Faculty
        </Button>

        <div className="space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-primary">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {isEditMode
                ? "Edit faculty"
                : "Add faculty"}
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              {isEditMode
                ? "Update the faculty profile and department assignment."
                : "Create a faculty account and profile for the appointment system."}
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="overflow-hidden rounded-2xl border bg-card"
      >
        <div className="space-y-8 p-5 sm:p-7">
          {!isEditMode ? (
            <FormSection
              title="Account"
              description="Set the credentials used by the faculty member to sign in."
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="faculty@example.com"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />

                <FieldError message={errors.email?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">
                  Initial password
                </Label>

                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter an initial password"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Use at least 8 characters. The faculty member can
                  use this password when signing in.
                </p>

                <FieldError message={errors.password?.message} />
              </div>
            </FormSection>
          ) : (
            <section className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">
                Account information
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Account credentials are not editable from this
                profile form.
              </p>
            </section>
          )}

          <div className="border-t" />

          <FormSection
            title="Basic information"
            description="Maintain the faculty member's identity and academic assignment."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>

                <Input
                  id="firstName"
                  autoComplete="given-name"
                  placeholder="First name"
                  aria-invalid={Boolean(errors.firstName)}
                  {...register("firstName")}
                />

                <FieldError message={errors.firstName?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>

                <Input
                  id="lastName"
                  autoComplete="family-name"
                  placeholder="Last name"
                  aria-invalid={Boolean(errors.lastName)}
                  {...register("lastName")}
                />

                <FieldError message={errors.lastName?.message} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="employeeNumber">
                Employee number
              </Label>

              <Input
                id="employeeNumber"
                placeholder="Employee number"
                aria-invalid={Boolean(errors.employeeNumber)}
                {...register("employeeNumber")}
              />

              <FieldError
                message={errors.employeeNumber?.message}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="departmentId">Department</Label>

              <select
                id="departmentId"
                value={selectedDepartmentId}
                onChange={(event) => {
                  setValue(
                    "departmentId",
                    event.target.value,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    },
                  )
                }}
                aria-invalid={Boolean(errors.departmentId)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">
                  Select a department
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>

              <FieldError
                message={errors.departmentId?.message}
              />
            </div>
          </FormSection>
        </div>

        {(submitError || submitSuccess) && (
          <div className="border-t px-5 py-4 sm:px-7">
            {submitError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                <p className="font-medium">
                  Unable to save faculty
                </p>

                <p className="mt-1 leading-5">
                  {submitError}
                </p>
              </div>
            ) : null}

            {submitSuccess ? (
              <div
                role="status"
                className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400"
              >
                <Check
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />

                <span>
                  {isEditMode
                    ? "Faculty profile updated successfully."
                    : "Faculty account created successfully."}
                </span>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t bg-muted/10 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/faculty")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || submitSuccess}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                {isEditMode
                  ? "Saving..."
                  : "Creating..."}
              </>
            ) : submitSuccess ? (
              <>
                <Check
                  className="size-4"
                  aria-hidden="true"
                />
                Saved
              </>
            ) : isEditMode ? (
              "Save changes"
            ) : (
              "Create faculty"
            )}
          </Button>
        </div>
      </form>
    </main>
  )
}
