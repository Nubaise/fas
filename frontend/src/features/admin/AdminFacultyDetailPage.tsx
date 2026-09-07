import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Pencil,
  UserRound,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { routes } from "@/routes/routes"

import {
  useDepartmentsQuery,
  useFacultyQuery,
} from "@/features/faculty/faculty-queries"

function DetailRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>

      <dd className="min-w-0 text-sm font-medium sm:text-right">
        {children ?? value}
      </dd>
    </div>
  )
}

export function AdminFacultyDetailPage() {
  const navigate = useNavigate()
  const { facultyId } = useParams()

  const facultyQuery = useFacultyQuery()
  const departmentsQuery = useDepartmentsQuery()

  if (facultyQuery.isPending || departmentsQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <LoadingState />
      </main>
    )
  }

  if (facultyQuery.isError || departmentsQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <ErrorState
          message="Unable to load faculty details."
          onRetry={() => {
            void facultyQuery.refetch()
            void departmentsQuery.refetch()
          }}
        />
      </main>
    )
  }

  const faculty = facultyQuery.data?.find(
    (member) => member.id === facultyId,
  )

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2 px-2"
          onClick={() => navigate(`${routes.admin}/faculty`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Faculty
        </Button>

        <section className="rounded-2xl border border-dashed bg-card p-10 text-center sm:p-14">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UserRound className="size-6" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-lg font-semibold tracking-tight">
            Faculty member not found
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The faculty profile you are trying to view could not be
            found.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => navigate(`${routes.admin}/faculty`)}
          >
            Back to faculty
          </Button>
        </section>
      </main>
    )
  }

  const department = departmentsQuery.data?.find(
    (item) => item.id === faculty.departmentId,
  )

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <section className="space-y-6">
        <Button
          type="button"
          variant="ghost"
          className="w-fit gap-2 px-2"
          onClick={() => navigate(`${routes.admin}/faculty`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Faculty
        </Button>

        <div className="flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound
                  className="size-7"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">
                  Faculty profile
                </p>

                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  {faculty.firstName} {faculty.lastName}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {department?.name ?? "Department unavailable"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(
                    `${routes.admin}/faculty/${faculty.id}/edit`,
                  )
                }
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit profile
              </Button>

              <Button
                type="button"
                onClick={() =>
                  navigate(
                    `${routes.admin}/faculty/${faculty.id}/availability`,
                  )
                }
              >
                <CalendarDays
                  className="size-4"
                  aria-hidden="true"
                />
                Manage availability
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-t pt-5 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Employee number
              </p>

              <p className="mt-1.5 font-medium">
                {faculty.employeeNumber}
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Department
              </p>

              <p className="mt-1.5 font-medium">
                {department?.name ?? "Department unavailable"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <div className="border-b pb-5">
            <h2 className="font-semibold tracking-tight">
              Profile information
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Core information currently stored for this faculty
              profile.
            </p>
          </div>

          <dl className="mt-5">
            <DetailRow
              label="First name"
              value={faculty.firstName}
            />

            <DetailRow
              label="Last name"
              value={faculty.lastName}
            />

            <DetailRow
              label="Employee number"
              value={faculty.employeeNumber}
            />

            <DetailRow label="Department">
              <span className="inline-flex items-center gap-1.5">
                {department?.name ?? "Department unavailable"}

                {department?.code ? (
                  <span className="font-normal text-muted-foreground">
                    ({department.code})
                  </span>
                ) : null}
              </span>
            </DetailRow>
          </dl>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <Check className="size-4" aria-hidden="true" />
            </div>

            <h2 className="mt-4 font-semibold tracking-tight">
              Faculty profile
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              This profile is available for administration and
              appointment scheduling.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <p className="text-sm font-medium">
              Quick actions
            </p>

            <div className="mt-4 grid gap-1">
              <button
                type="button"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() =>
                  navigate(
                    `${routes.admin}/faculty/${faculty.id}/edit`,
                  )
                }
              >
                <span className="flex items-center gap-3">
                  <Pencil
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Edit profile
                </span>

                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() =>
                  navigate(
                    `${routes.admin}/faculty/${faculty.id}/availability`,
                  )
                }
              >
                <span className="flex items-center gap-3">
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Manage availability
                </span>

                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
