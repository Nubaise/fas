import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  AlertTriangle,
  Building2,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"

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

type ModalMode = "create" | "edit"

function Modal({
  title,
  description,
  children,
  onClose,
  closeDisabled = false,
}: {
  title: string
  description?: string
  children: React.ReactNode
  onClose: () => void
  closeDisabled?: boolean
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
        if (
          event.target === event.currentTarget &&
          !closeDisabled
        ) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div className="min-w-0">
            <h2
              id="department-modal-title"
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

export function AdminDepartmentsPage() {
  const departmentsQuery = useDepartmentsQuery()

  const createMutation = useCreateDepartmentMutation()
  const updateMutation = useUpdateDepartmentMutation()
  const deleteMutation = useDeleteDepartmentMutation()

  const [modalMode, setModalMode] =
    useState<ModalMode | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [submitError, setSubmitError] =
    useState<string | null>(null)

  const [actionError, setActionError] =
    useState<string | null>(null)

  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null)

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
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (departmentsQuery.isError) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Departments
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Manage the academic departments used across FAS.
          </p>
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

  const isDeleting = deleteMutation.isPending

  function openCreateModal() {
    setEditingId(null)
    setSubmitError(null)
    setActionError(null)
    setActionSuccess(null)

    reset({
      name: "",
      code: "",
    })

    setModalMode("create")
  }

  function openEditModal(id: string) {
    const department = departments.find(
      (item) => item.id === id,
    )

    if (!department) return

    setEditingId(id)
    setSubmitError(null)
    setActionError(null)
    setActionSuccess(null)

    reset({
      name: department.name,
      code: department.code,
    })

    setModalMode("edit")
  }

  function closeFormModal() {
    if (isSubmitting) return

    setModalMode(null)
    setEditingId(null)
    setSubmitError(null)

    reset({
      name: "",
      code: "",
    })
  }

  async function onSubmit(data: DepartmentFormValues) {
    setSubmitError(null)
    setActionError(null)

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name: data.name,
            code: data.code,
          },
        })

        setActionSuccess("Department updated successfully.")
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          code: data.code,
        })

        setActionSuccess("Department created successfully.")
      }

      closeFormModal()
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

  function openDeleteModal(id: string) {
    setActionError(null)
    setActionSuccess(null)
    setDeleteId(id)
  }

  async function confirmDelete() {
    if (!deleteId) return

    setActionError(null)

    try {
      await deleteMutation.mutateAsync(deleteId)

      setDeleteId(null)
      setActionSuccess("Department deleted successfully.")
    } catch (error) {
      setDeleteId(null)

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete department. Please try again.",
      )
    }
  }

  const deleteDepartment = departments.find(
    (department) => department.id === deleteId,
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Departments
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Manage the academic departments used across FAS.
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreateModal}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add department
        </Button>
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

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              All departments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {departments.length === 1
                ? "1 department"
                : `${departments.length} departments`}
            </p>
          </div>
        </div>

        {departments.length === 0 ? (
          <section className="rounded-2xl border border-dashed bg-card p-10 text-center sm:p-14">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Building2
                className="size-6"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-5 font-semibold tracking-tight">
              No departments yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Create the first academic department to start
              organizing faculty across FAS.
            </p>

            <Button
              type="button"
              className="mt-6"
              onClick={openCreateModal}
            >
              <Plus
                className="size-4"
                aria-hidden="true"
              />
              Add department
            </Button>
          </section>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="hidden grid-cols-[1fr_180px_auto] items-center gap-5 border-b bg-muted/20 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
              <span>Department</span>
              <span>Code</span>
              <span className="sr-only">Actions</span>
            </div>

            <div className="divide-y">
              {departments.map((department) => (
                <article
                  key={department.id}
                  className="p-5 transition-colors duration-150 hover:bg-muted/15"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-center md:gap-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground">
                        <Building2
                          className="size-5"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {department.name}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground md:hidden">
                          Department
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="inline-flex rounded-lg border bg-muted/40 px-2.5 py-1 text-sm font-medium">
                        {department.code}
                      </span>
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openEditModal(department.id)
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
                          openDeleteModal(department.id)
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

      {modalMode ? (
        <Modal
          title={
            modalMode === "edit"
              ? "Edit department"
              : "Add department"
          }
          description={
            modalMode === "edit"
              ? "Update the department name or code."
              : "Create a department with its academic name and code."
          }
          onClose={closeFormModal}
          closeDisabled={isSubmitting}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-6 p-5 sm:p-6"
          >
            {editingDepartment ? (
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  {editingDepartment.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Currently using code{" "}
                  <span className="font-medium">
                    {editingDepartment.code}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="department-name">
                  Department name
                </Label>

                <Input
                  id="department-name"
                  placeholder="Computer Science"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />

                {errors.name ? (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="department-code">
                  Department code
                </Label>

                <Input
                  id="department-code"
                  placeholder="CSE"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.code)}
                  {...register("code")}
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Use the official academic abbreviation for the
                  department.
                </p>

                {errors.code ? (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.code.message}
                  </p>
                ) : null}
              </div>
            </div>

            {submitError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeFormModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {modalMode === "edit"
                      ? "Saving..."
                      : "Creating..."}
                  </>
                ) : modalMode === "edit" ? (
                  <>
                    <Check
                      className="size-4"
                      aria-hidden="true"
                    />
                    Save changes
                  </>
                ) : (
                  <>
                    <Plus
                      className="size-4"
                      aria-hidden="true"
                    />
                    Create department
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteId ? (
        <Modal
          title="Delete department?"
          description="This action cannot be undone."
          onClose={() => {
            if (!isDeleting) {
              setDeleteId(null)
            }
          }}
          closeDisabled={isDeleting}
        >
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {deleteDepartment?.name ?? "This department"}
                </p>

                {deleteDepartment ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Department code:{" "}
                    <span className="font-medium">
                      {deleteDepartment.code}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              If this department has dependent records, the
              backend may prevent the deletion.
            </p>

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  void confirmDelete()
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2
                      className="size-4"
                      aria-hidden="true"
                    />
                    Delete department
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
