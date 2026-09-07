import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { routes } from "@/routes/routes"
import { useDepartmentsQuery, useFacultyQuery } from "./faculty-queries"

export function StudentFacultyPage() {
  const navigate = useNavigate()
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
    return <ErrorState />
  }

  const faculty = facultyQuery.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Student Portal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Find a faculty member</h1>
        <p className="text-muted-foreground">
          Browse faculty and choose someone to view their available appointment slots.
        </p>
      </section>

      {faculty.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="font-semibold">No faculty available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no faculty members available to browse.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.map((member) => (
            <article key={member.id} className="rounded-xl border p-6">
              <h2 className="font-semibold">
                {member.firstName} {member.lastName}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {departmentNames.get(member.departmentId) ?? "Department unavailable"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Employee #{member.employeeNumber}
              </p>

              <Button
                className="mt-4"
                onClick={() =>
                  navigate(`${routes.student}/faculty/${member.id}`)
                }
              >
                View availability
              </Button>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
