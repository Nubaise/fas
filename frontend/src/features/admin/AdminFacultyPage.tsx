import { useMemo, useRef, useState } from "react"
import { FileUp, Plus, Settings, UserRound } from "lucide-react"
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
    .split(/\\r?\\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error("CSV must contain a header and at least one faculty row.")
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

  const indexes = new Map(headers.map((header, index) => [header, index]))

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
    return <LoadingState />
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <ErrorState
        message="Unable to load faculty."
        onRetry={() => {
          void facultyQuery.refetch()
          void departmentsQuery.refetch()
        }}
      />
    )
  }

  const faculty = facultyQuery.data ?? []
  const departments = departmentsQuery.data ?? []

  async function handleBulkFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    setBulkError(null)
    setBulkResult(null)

    try {
      const rows = parseFacultyCsv(await file.text(), departments)
      setBulkRows(rows)
      setIsBulkOpen(true)
    } catch (error) {
      setBulkRows([])
      setBulkError(
        error instanceof Error ? error.message : "Unable to read CSV file.",
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Faculty Management
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Create and manage faculty profiles and their availability.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleBulkFile}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="size-4" aria-hidden="true" />
            Bulk Add
          </Button>

          <Button onClick={() => navigate(`${routes.admin}/faculty/new`)}>
            <Plus className="size-4" aria-hidden="true" />
            Add Faculty
          </Button>
        </div>
      </section>

      {bulkError && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {bulkError}
        </section>
      )}

      {bulkResult && (
        <section className="rounded-xl border p-4">
          <p className="font-medium">
            Bulk import finished: {bulkResult.successful} successful,{" "}
            {bulkResult.failed.length} failed.
          </p>

          {bulkResult.failed.length > 0 && (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {bulkResult.failed.map((item) => (
                <p key={`${item.row}-${item.email}`}>
                  Row {item.row} — {item.email || "unknown email"}:{" "}
                  {item.message}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {isBulkOpen && (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Bulk Add Faculty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                CSV columns: email, password, employeeNumber, firstName,
                lastName, departmentId.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Department can be an existing ID, code, or name.
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setIsBulkOpen(false)
                setBulkRows([])
                setBulkError(null)
              }}
            >
              Close
            </Button>
          </div>

          {bulkRows.length > 0 && (
            <>
              <div className="mt-5 rounded-lg border p-4">
                <p className="font-medium">
                  {bulkRows.length} faculty row
                  {bulkRows.length === 1 ? "" : "s"} ready
                </p>

                <div className="mt-3 max-h-64 overflow-auto text-sm">
                  {bulkRows.map((row, index) => (
                    <div
                      key={`${row.email}-${index}`}
                      className="grid gap-1 border-b py-2 last:border-b-0 sm:grid-cols-3"
                    >
                      <span>{row.email}</span>
                      <span>{row.employeeNumber}</span>
                      <span>
                        {departments.find(
                          (department) => department.id === row.departmentId,
                        )?.name ?? row.departmentId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBulkOpen(false)
                    setBulkRows([])
                  }}
                >
                  Cancel
                </Button>

                <Button
                  disabled={bulkMutation.isPending}
                  onClick={() => void submitBulk()}
                >
                  {bulkMutation.isPending ? "Importing..." : "Import Faculty"}
                </Button>
              </div>
            </>
          )}

          {bulkRows.length === 0 && !bulkError && (
            <p className="mt-5 text-sm text-muted-foreground">
              Choose a CSV file to preview the faculty rows before importing.
            </p>
          )}
        </section>
      )}

      {faculty.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-6 text-muted-foreground" />
          </div>

          <h2 className="mt-4 font-semibold">No faculty members</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no faculty profiles in the system.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate(`${routes.admin}/faculty/new`)}
          >
            Add Faculty
          </Button>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.map((member) => (
            <article
              key={member.id}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-semibold">
                    {member.firstName} {member.lastName}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {departmentNames.get(member.departmentId) ??
                      "Department unavailable"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>Employee #{member.employeeNumber}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`${routes.admin}/faculty/${member.id}`)
                  }
                >
                  Manage
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `${routes.admin}/faculty/${member.id}/availability`,
                    )
                  }
                >
                  <Settings className="size-4" aria-hidden="true" />
                  Availability
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
