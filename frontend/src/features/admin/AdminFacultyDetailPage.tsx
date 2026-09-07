import { ArrowLeft, CalendarDays, Pencil, UserRound } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { routes } from "@/routes/routes"

import {
  useDepartmentsQuery,
  useFacultyQuery,
} from "@/features/faculty/faculty-queries"

export function AdminFacultyDetailPage() {
  const navigate = useNavigate()
  const { facultyId } = useParams()

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  if (facultyQuery.isPending || departmentsQuery.isPending) {
    return <LoadingState />
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <ErrorState
        message="Unable to load faculty details."
        onRetry={() => {
          void facultyQuery.refetch()
          void departmentsQuery.refetch()
        }}
      />
    )
  }

  const faculty = facultyQuery.data?.find(
    (member) => member.id === facultyId,
  )

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => navigate(`${routes.admin}/faculty`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Faculty
        </Button>

        <div className="rounded-xl border p-8 text-center">
          <h1 className="text-xl font-semibold">Faculty member not found</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The requested faculty profile could not be found.
          </p>
        </div>
      </main>
    )
  }

  const department = departmentsQuery.data?.find(
    (item) => item.id === faculty.departmentId,
  )

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="-ml-3 w-fit"
            onClick={() => navigate(`${routes.admin}/faculty`)}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Faculty
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-6" aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Faculty Profile
              </p>

              <h1 className="text-3xl font-semibold tracking-tight">
                {faculty.firstName} {faculty.lastName}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`${routes.admin}/faculty/${faculty.id}/edit`)
            }
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>

          <Button
            onClick={() =>
              navigate(
                `${routes.admin}/faculty/${faculty.id}/availability`,
              )
            }
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Availability
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">First Name</p>
          <p className="mt-2 font-medium">{faculty.firstName}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Last Name</p>
          <p className="mt-2 font-medium">{faculty.lastName}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Employee Number</p>
          <p className="mt-2 font-medium">{faculty.employeeNumber}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Department</p>
          <p className="mt-2 font-medium">
            {department?.name ?? "Department unavailable"}
          </p>
        </div>
      </section>
    </main>
  )
}
