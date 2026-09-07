import { useMemo } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useAuth } from "@/features/auth/AuthProvider"
import { useDepartmentsQuery } from "./faculty-queries"
import {
  useFacultyQuery,
  useUpdateFacultyMutation,
} from "./faculty-queries"

type ProfileFormValues = {
  firstName: string
  lastName: string
}

export function FacultyProfilePage() {
  const { user } = useAuth()

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()
  const updateMutation = useUpdateFacultyMutation()

  const faculty = useMemo(
    () => facultyQuery.data?.find((item) => item.userId === user?.id),
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

  if (facultyQuery.isLoading || departmentsQuery.isLoading) {
    return <LoadingState />
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <ErrorState message="Unable to load your faculty profile." />
    )
  }

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Faculty Portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Profile not found
          </h1>
          <p className="text-muted-foreground">
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
  })

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Faculty Portal
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Your Profile
        </h1>

        <p className="text-muted-foreground">
          View your faculty information and update your name.
        </p>
      </section>

      <section className="rounded-xl border p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                {...form.register("firstName", {
                  required: "First name is required",
                })}
                aria-invalid={Boolean(form.formState.errors.firstName)}
              />

              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                {...form.register("lastName", {
                  required: "Last name is required",
                })}
                aria-invalid={Boolean(form.formState.errors.lastName)}
              />

              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeNumber">
                Employee number
              </Label>
              <Input
                id="employeeNumber"
                value={faculty.employeeNumber}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={
                  department
                    ? `${department.name} (${department.code})`
                    : "Unknown department"
                }
                disabled
              />
            </div>
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              Unable to update your profile. Please try again.
            </p>
          )}

          {updateMutation.isSuccess && (
            <p className="text-sm text-muted-foreground">
              Profile updated successfully.
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
