import {
  ArrowRight,
  Building2,
  Search,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { routes } from "@/routes/routes"
import { useDepartmentsQuery, useFacultyQuery } from "./faculty-queries"

export function StudentFacultyPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

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

  const faculty = facultyQuery.data ?? []

  const filteredFaculty = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return faculty
    }

    return faculty.filter((member) => {
      const fullName =
        `${member.firstName} ${member.lastName}`.toLowerCase()

      const department =
        departmentNames.get(member.departmentId)?.toLowerCase() ?? ""

      const employeeNumber = member.employeeNumber.toLowerCase()

      return (
        fullName.includes(normalizedSearch) ||
        department.includes(normalizedSearch) ||
        employeeNumber.includes(normalizedSearch)
      )
    })
  }, [departmentNames, faculty, search])

  if (facultyQuery.isPending || departmentsQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <LoadingState />
      </main>
    )
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <ErrorState
          onRetry={() => {
            void facultyQuery.refetch()
            void departmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  const hasSearch = search.trim().length > 0

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:gap-10">
      <section className="border-b pb-8 lg:pb-10">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            Faculty directory
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find a faculty member
          </h1>

          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Browse faculty members and choose someone to view their
            availability and request an appointment.
          </p>
        </div>
      </section>

      {faculty.length > 0 && (
        <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-lg">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, department, or employee number"
              aria-label="Search faculty"
              className="h-10 pl-9 pr-9"
            />

            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear faculty search"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  ×
                </span>
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />

            <span>
              {filteredFaculty.length}{" "}
              {filteredFaculty.length === 1
                ? "faculty member"
                : "faculty members"}
            </span>
          </div>
        </section>
      )}

      {faculty.length === 0 ? (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            No faculty available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            There are currently no faculty members available to browse.
          </p>
        </section>
      ) : filteredFaculty.length === 0 ? (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Search
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            No matching faculty
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Try a different name, department, or employee number.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => setSearch("")}
          >
            Clear search
          </Button>
        </section>
      ) : (
        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Faculty members"
        >
          {filteredFaculty.map((member) => {
            const department =
              departmentNames.get(member.departmentId) ??
              "Department unavailable"

            return (
              <button
                key={member.id}
                type="button"
                onClick={() =>
                  navigate(`${routes.student}/faculty/${member.id}`)
                }
                className={[
                  "group flex min-h-52 flex-col rounded-2xl border bg-card p-5 text-left",
                  "transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out",
                  "hover:-translate-y-0.5 hover:border-ring/40 hover:bg-muted/20 hover:shadow-sm",
                  "active:translate-y-0 active:bg-muted/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "dark:hover:border-ring/50 dark:hover:bg-muted/20",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-150 group-hover:bg-primary/15">
                    <Users className="size-5" aria-hidden="true" />
                  </div>

                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-5 min-w-0">
                  <h2 className="truncate text-base font-semibold tracking-tight">
                    {member.firstName} {member.lastName}
                  </h2>

                  <div className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />

                    <span className="truncate">{department}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Employee number
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {member.employeeNumber}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-primary">
                    View availability
                  </span>
                </div>
              </button>
            )
          })}
        </section>
      )}
    </main>
  )
}
