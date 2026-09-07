import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  GraduationCap,
  Loader2,
  Plus,
  Settings,
  Upload,
  UserRound,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { routes } from "@/routes/routes"

import {
  useBulkOnboardFacultyMutation,
  useDepartmentsQuery,
  useFacultyQuery,
} from "@/features/faculty/faculty-queries"
import type { BulkOnboardFacultyItem } from "@/features/faculty/faculty-api"

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

function parseFacultyCsv(
  text: string,
  departments: { id: string; name: string; code: string }[],
) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error(
      "CSV must contain a header and at least one faculty row.",
    )
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.trim().toLowerCase(),
  )

  const requiredHeaders = [
    "email",
    "password",
    "employeenumber",
    "firstname",
    "lastname",
    "departmentid",
  ]

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error(
      "CSV headers must be: email,password,employeeNumber,firstName,lastName,departmentId",
    )
  }

  const indexes = new Map(
    headers.map((header, index) => [header, index]),
  )

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line)

    const get = (header: string) =>
      values[indexes.get(header) ?? -1]?.trim() ?? ""

    const departmentValue = get("departmentid")

    const department = departments.find(
      (item) =>
        item.id === departmentValue ||
        item.code.toLowerCase() === departmentValue.toLowerCase() ||
        item.name.toLowerCase() === departmentValue.toLowerCase(),
    )

    if (!department) {
      throw new Error(
        `Row ${index + 2}: departmentId must match an existing department ID, code, or name.`,
      )
    }

    return {
      email: get("email"),
      password: get("password"),
      employeeNumber: get("employeenumber"),
      firstName: get("firstname"),
      lastName: get("lastname"),
      departmentId: department.id,
    } satisfies BulkOnboardFacultyItem
  })
}

function BulkImportDialog({
  rows,
  departments,
  error,
  result,
  pending,
  onImport,
  onClose,
}: {
  rows: BulkOnboardFacultyItem[]
  departments: { id: string; name: string; code: string }[]
  error: string | null
  result: {
    successful: number
    failed: { row: number; email: string; message: string }[]
  } | null
  pending: boolean
  onImport: () => void
  onClose: () => void
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, pending])

  const hasRows = rows.length > 0
  const hasResult = result !== null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-import-title"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2
                id="bulk-import-title"
                className="font-semibold tracking-tight"
              >
                Bulk add faculty
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Preview the imported faculty records before sending
                them to the system.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={pending}
            aria-label="Close bulk import"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <X
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <div>
                <p className="font-medium">Unable to prepare import</p>
                <p className="mt-1 leading-5">{error}</p>
              </div>
            </div>
          ) : null}

          {hasResult ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                    <CheckCircle2
                      className="size-5"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="font-semibold">
                      Import finished
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.successful} successful and{" "}
                      {result.failed.length} failed.
                    </p>
                  </div>
                </div>
              </div>

              {result.failed.length > 0 ? (
                <div className="rounded-xl border">
                  <div className="border-b px-4 py-3">
                    <p className="text-sm font-medium">
                      Failed rows
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {result.failed.map((item) => (
                      <div
                        key={`${item.row}-${item.email}`}
                        className="border-b px-4 py-3 text-sm last:border-b-0"
                      >
                        <p className="font-medium">
                          Row {item.row}
                          {item.email ? ` · ${item.email}` : ""}
                        </p>

                        <p className="mt-1 text-muted-foreground">
                          {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : hasRows ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">
                  {rows.length} faculty row
                  {rows.length === 1 ? "" : "s"} ready to import
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Review the parsed records below before importing.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <div className="grid grid-cols-[1.4fr_1fr_1.2fr] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Email</span>
                  <span>Employee number</span>
                  <span>Department</span>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {rows.map((row, index) => (
                    <div
                      key={`${row.email}-${index}`}
                      className="grid grid-cols-[1.4fr_1fr_1.2fr] gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="min-w-0 truncate">
                        {row.email}
                      </span>

                      <span className="min-w-0 truncate text-muted-foreground">
                        {row.employeeNumber}
                      </span>

                      <span className="min-w-0 truncate text-muted-foreground">
                        {departments.find(
                          (department) =>
                            department.id === row.departmentId,
                        )?.name ?? row.departmentId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
                Importing will create the faculty accounts represented
                by these rows.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <FileUp
                className="mx-auto size-6 text-muted-foreground"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-medium">
                No faculty rows loaded
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose a CSV file to preview faculty records.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-muted/10 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            {hasResult ? "Done" : "Cancel"}
          </Button>

          {hasRows && !hasResult ? (
            <Button
              type="button"
              onClick={onImport}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Importing...
                </>
              ) : (
                <>
                  <Upload
                    className="size-4"
                    aria-hidden="true"
                  />
                  Import faculty
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FacultyCard({
  firstName,
  lastName,
  department,
  employeeNumber,
  onManage,
  onAvailability,
}: {
  firstName: string
  lastName: string
  department: string
  employeeNumber: string
  onManage: () => void
  onAvailability: () => void
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all duration-150 hover:-translate-y-px hover:bg-muted/20 hover:shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserRound className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate font-semibold tracking-tight">
            {firstName} {lastName}
          </h2>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {department}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 border-t pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Employee number
        </p>

        <p className="mt-1 text-sm font-medium">
          {employeeNumber}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="sm"
          className="justify-between sm:flex-1"
          onClick={onManage}
        >
          Manage
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="justify-center"
          onClick={onAvailability}
        >
          <Settings className="size-4" aria-hidden="true" />
          <span className="sm:hidden lg:inline">Availability</span>
        </Button>
      </div>
    </article>
  )
}

function EmptyFacultyState({
  onAdd,
}: {
  onAdd: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center sm:p-14">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <GraduationCap className="size-6" aria-hidden="true" />
      </div>

      <h2 className="mt-5 font-semibold tracking-tight">
        No faculty members yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add a faculty member individually or use the bulk import
        workflow to onboard multiple faculty accounts.
      </p>

      <Button
        type="button"
        className="mt-6"
        onClick={onAdd}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add faculty
      </Button>
    </div>
  )
}

export function AdminFacultyPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkRows, setBulkRows] = useState<BulkOnboardFacultyItem[]>([])
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<{
    successful: number
    failed: { row: number; email: string; message: string }[]
  } | null>(null)

  const bulkMutation = useBulkOnboardFacultyMutation()

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  const departmentNames = useMemo(
    () =>
      new Map(
        (departmentsQuery.data ?? []).map((department) => [
          department.id,
          department.name,
        ]),
      ),
    [departmentsQuery.data],
  )

  if (facultyQuery.isPending || departmentsQuery.isPending) {
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
          message="Unable to load faculty management data."
          onRetry={() => {
            void facultyQuery.refetch()
            void departmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  const faculty = facultyQuery.data ?? []
  const departments = departmentsQuery.data ?? []

  function resetBulkState() {
    setIsBulkOpen(false)
    setBulkRows([])
    setBulkError(null)
    setBulkResult(null)
  }

  async function handleBulkFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setBulkError(null)
    setBulkResult(null)

    try {
      const rows = parseFacultyCsv(
        await file.text(),
        departments,
      )

      setBulkRows(rows)
      setIsBulkOpen(true)
    } catch (error) {
      setBulkRows([])
      setBulkError(
        error instanceof Error
          ? error.message
          : "Unable to read CSV file.",
      )
      setIsBulkOpen(true)
    }
  }

  async function submitBulk() {
    setBulkError(null)

    try {
      const result = await bulkMutation.mutateAsync({
        faculty: bulkRows,
      })

      setBulkResult({
        successful: result.successful.length,
        failed: result.failed.map((item) => ({
          row: item.row,
          email: item.email,
          message: item.message,
        })),
      })

      setBulkRows([])
    } catch (error) {
      setBulkError(
        error instanceof Error
          ? error.message
          : "Unable to import faculty.",
      )
    }
  }

  function openBulkImport() {
    setBulkError(null)
    setBulkResult(null)
    setBulkRows([])
    setIsBulkOpen(true)
  }

  const pageActions = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleBulkFile}
      />

      <Button
        type="button"
        variant="outline"
        onClick={openBulkImport}
      >
        <FileUp className="size-4" aria-hidden="true" />
        Bulk add
      </Button>

      <Button
        type="button"
        onClick={() =>
          navigate(`${routes.admin}/faculty/new`)
        }
      >
        <Plus className="size-4" aria-hidden="true" />
        Add faculty
      </Button>
    </>
  )

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">
              Administration
            </p>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Faculty management
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Manage faculty profiles and their availability from
                one workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {pageActions}
          </div>
        </section>

        <section
          aria-label="Faculty overview"
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-muted-foreground">
                Faculty members
              </p>

              <GraduationCap
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {faculty.length}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Faculty profiles currently available to manage.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-muted-foreground">
                Departments
              </p>

              <GraduationCap
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {departments.length}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Academic departments available for faculty records.
            </p>
          </div>
        </section>

        <section aria-labelledby="faculty-list-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="faculty-list-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Faculty
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Select a faculty member to manage their profile or
                availability.
              </p>
            </div>

            {faculty.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {faculty.length} member
                {faculty.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          {faculty.length === 0 ? (
            <EmptyFacultyState
              onAdd={() =>
                navigate(`${routes.admin}/faculty/new`)
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {faculty.map((member) => (
                <FacultyCard
                  key={member.id}
                  firstName={member.firstName}
                  lastName={member.lastName}
                  department={
                    departmentNames.get(member.departmentId) ??
                    "Department unavailable"
                  }
                  employeeNumber={member.employeeNumber}
                  onManage={() =>
                    navigate(
                      `${routes.admin}/faculty/${member.id}`,
                    )
                  }
                  onAvailability={() =>
                    navigate(
                      `${routes.admin}/faculty/${member.id}/availability`,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {isBulkOpen ? (
        <BulkImportDialog
          rows={bulkRows}
          departments={departments}
          error={bulkError}
          result={bulkResult}
          pending={bulkMutation.isPending}
          onImport={() => void submitBulk()}
          onClose={resetBulkState}
        />
      ) : null}
    </>
  )
}
