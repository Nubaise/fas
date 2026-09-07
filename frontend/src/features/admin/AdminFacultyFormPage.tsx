import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"

import {
  useDepartmentsQuery,
  useFacultyQuery,
  useOnboardFacultyMutation,
  useUpdateFacultyMutation,
} from "@/features/faculty/faculty-queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/shared/LoadingState"

const facultyFormSchema = z.object({
  email: z.string(),
  password: z.string(),
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

export function AdminFacultyFormPage() {
  const navigate = useNavigate()
  const { facultyId } = useParams()

  const isEditMode = Boolean(facultyId)

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  const onboardFacultyMutation = useOnboardFacultyMutation()
  const updateFacultyMutation = useUpdateFacultyMutation()

  const [submitError, setSubmitError] = useState<string | null>(null)

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
    return <LoadingState />
  }

  if (departmentsQuery.isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          Unable to load departments
        </h1>

        <p className="text-sm text-muted-foreground">
          The department list could not be loaded.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void departmentsQuery.refetch()
          }}
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (isEditMode && facultyQuery.isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          Unable to load faculty
        </h1>

        <p className="text-sm text-muted-foreground">
          The faculty profile could not be loaded.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void facultyQuery.refetch()
          }}
        >
          Try Again
        </Button>
      </div>
    )
  }

  const departments = departmentsQuery.data ?? []

  const faculty = facultyQuery.data?.find(
    (item) => item.id === facultyId,
  )

  if (isEditMode && !faculty) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          Faculty not found
        </h1>

        <p className="text-sm text-muted-foreground">
          The requested faculty profile does not exist.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/faculty")}
        >
          Back to Faculty
        </Button>
      </div>
    )
  }

  async function onSubmit(data: FacultyFormValues) {
    setSubmitError(null)

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

      navigate("/admin/faculty")
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/faculty")}
          aria-label="Back to faculty"
        >
          <ArrowLeft />
        </Button>

        <div>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? "Edit Faculty" : "Add Faculty"}
          </h1>

          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Update the faculty profile."
              : "Create a faculty account and profile."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6 rounded-lg border p-6"
      >
        {!isEditMode && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Initial Password
              </Label>

              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />

              <p className="text-xs text-muted-foreground">
                The password must contain at least 8 characters.
              </p>

              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </>
        )}

        <div className="grid gap-2">
          <Label htmlFor="employeeNumber">
            Employee Number
          </Label>

          <Input
            id="employeeNumber"
            {...register("employeeNumber")}
          />

          {errors.employeeNumber && (
            <p className="text-sm text-destructive">
              {errors.employeeNumber.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>

            <Input
              id="firstName"
              autoComplete="given-name"
              {...register("firstName")}
            />

            {errors.firstName && (
              <p className="text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>

            <Input
              id="lastName"
              autoComplete="family-name"
              {...register("lastName")}
            />

            {errors.lastName && (
              <p className="text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="departmentId">Department</Label>

          <select
            id="departmentId"
            value={selectedDepartmentId}
            onChange={(event) => {
              setValue("departmentId", event.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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

          {errors.departmentId && (
            <p className="text-sm text-destructive">
              {errors.departmentId.message}
            </p>
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3">
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
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}

            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Faculty"}
          </Button>
        </div>
      </form>
    </div>
  )
}
