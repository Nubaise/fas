import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Loader2, Pencil, Trash2 } from "lucide-react"

import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useDepartmentsQuery,
  useUpdateDepartmentMutation,
} from "@/features/faculty/faculty-queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"

const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required"),
  code: z.string().trim().min(1, "Department code is required"),
})

type DepartmentFormValues = z.infer<typeof departmentSchema>

export function AdminDepartmentsPage() {
  const departmentsQuery = useDepartmentsQuery()
  const createMutation = useCreateDepartmentMutation()
  const updateMutation = useUpdateDepartmentMutation()
  const deleteMutation = useDeleteDepartmentMutation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  })

  if (departmentsQuery.isLoading) {
    return <LoadingState />
  }

  if (departmentsQuery.isError) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Departments
          </h1>
        </section>

        <ErrorState
          message="Unable to load departments. The department list could not be loaded."
          onRetry={() => {
            void departmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  const departments = departmentsQuery.data ?? []
  const editingDepartment = departments.find(
    (department) => department.id === editingId,
  )
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending

  function startEdit(id: string) {
    const department = departments.find((item) => item.id === id)
    if (!department) return

    setEditingId(id)
    setSubmitError(null)
    reset({
      name: department.name,
      code: department.code,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setSubmitError(null)
    reset({ name: "", code: "" })
  }

  async function onSubmit(data: DepartmentFormValues) {
    setSubmitError(null)

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name: data.name,
            code: data.code,
          },
        })
      } else {
        await createMutation.mutateAsync(data)
      }

      cancelEdit()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : editingId
            ? "Unable to update department. Please try again."
            : "Unable to create department. Please try again.",
      )
    }
  }

  async function confirmDelete() {
    if (!deleteId) return

    setSubmitError(null)

    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    } catch (error) {
      setDeleteId(null)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to delete department. Please try again.",
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Departments
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Create and manage the academic departments used across FAS.
        </p>
      </section>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-xl border bg-card p-6">
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {editingDepartment ? "Edit department" : "Add department"}
          </p>
          <h2 className="text-xl font-semibold">
            {editingDepartment
              ? editingDepartment.name
              : "Create a new department"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {editingDepartment
              ? "Update the department name or code."
              : "Add a department with a unique name and code."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department-name">Name</Label>
              <Input
                id="department-name"
                placeholder="Computer Science"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-code">Code</Label>
              <Input
                id="department-code"
                placeholder="CSE"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {isSubmitting
                ? editingId
                  ? "Saving..."
                  : "Creating..."
                : editingId
                  ? "Save Changes"
                  : "Create Department"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">All departments</h2>
            <p className="text-sm text-muted-foreground">
              {departments.length === 1
                ? "1 department"
                : `${departments.length} departments`}
            </p>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No departments yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Use the form above to create the first academic department.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="divide-y">
              {departments.map((department) => (
                <article
                  key={department.id}
                  className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Building2
                        className="size-5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">
                        {department.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {department.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(department.id)}
                    >
                      <Pencil
                        className="mr-2 size-4"
                        aria-hidden="true"
                      />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(department.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2
                        className="mr-2 size-4"
                        aria-hidden="true"
                      />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-department-title"
        >
          <div className="w-full max-w-md space-y-5 rounded-xl border bg-background p-6 shadow-lg">
            <div>
              <h2
                id="delete-department-title"
                className="font-semibold"
              >
                Delete Department?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This action cannot be undone. If the department has
                dependent records, the backend will prevent deletion.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  void confirmDelete()
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {deleteMutation.isPending
                  ? "Deleting..."
                  : "Delete Department"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
