import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Building2,
  CalendarDays,
  GraduationCap,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { routes } from "@/routes/routes"

import { useAdminDashboardStats } from "./admin-queries"

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: number
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="group rounded-2xl border bg-card p-5 transition-colors duration-150 hover:bg-muted/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-150 group-hover:bg-primary/10 group-hover:text-primary">
          {icon}
        </div>

        <p className="text-3xl font-semibold tracking-tight">
          {value}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function ManagementCard({
  title,
  description,
  actionLabel,
  onClick,
  icon,
  primary = false,
}: {
  title: string
  description: string
  actionLabel: string
  onClick: () => void
  icon: React.ReactNode
  primary?: boolean
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card p-5 transition-all duration-150 hover:-translate-y-px hover:bg-muted/20 hover:shadow-sm sm:p-6">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>

      <div className="mt-5 flex-1">
        <h2 className="font-semibold tracking-tight">{title}</h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Button
        type="button"
        variant={primary ? "default" : "outline"}
        className="mt-6 w-full justify-between sm:w-fit"
        onClick={onClick}
      >
        {actionLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export function AdminDashboardPage() {
  const navigate = useNavigate()

  const {
    stats,
    isLoading,
    isError,
    facultyQuery,
    departmentsQuery,
    appointmentsQuery,
  } = useAdminDashboardStats()

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin dashboard
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Manage the academic scheduling system from one place.
          </p>
        </section>

        <LoadingState />
      </main>
    )
  }

  if (isError) {
    const retry = () => {
      void facultyQuery.refetch()
      void departmentsQuery.refetch()
      void appointmentsQuery.refetch()
    }

    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Administration
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin dashboard
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Manage the academic scheduling system from one place.
          </p>
        </section>

        <ErrorState
          message="Unable to load admin dashboard data."
          onRetry={retry}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6">
      <section className="space-y-3">
        <p className="text-sm font-medium text-primary">
          Administration
        </p>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Keep faculty, departments, and appointments organized
            from one place.
          </p>
        </div>
      </section>

      <section aria-labelledby="overview-heading" className="space-y-4">
        <div>
          <h2
            id="overview-heading"
            className="text-lg font-semibold tracking-tight"
          >
            System overview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            A quick view of the current system state.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Faculty"
            value={stats.facultyCount}
            description="Faculty members currently managed by the system."
            icon={
              <GraduationCap
                className="size-4"
                aria-hidden="true"
              />
            }
          />

          <StatCard
            label="Departments"
            value={stats.departmentCount}
            description="Academic departments available in the system."
            icon={
              <Building2
                className="size-4"
                aria-hidden="true"
              />
            }
          />

          <StatCard
            label="Appointments"
            value={stats.appointmentCount}
            description="Appointments recorded across the system."
            icon={
              <CalendarDays
                className="size-4"
                aria-hidden="true"
              />
            }
          />

          <StatCard
            label="Pending appointments"
            value={stats.pendingAppointmentCount}
            description="Requests currently waiting for a decision."
            icon={
              <Users
                className="size-4"
                aria-hidden="true"
              />
            }
          />
        </div>
      </section>

      <section
        aria-labelledby="attention-heading"
        className="rounded-2xl border bg-card p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Needs attention
            </p>

            <h2
              id="attention-heading"
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              Pending appointment requests
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {stats.pendingAppointmentCount > 0
                ? `${stats.pendingAppointmentCount} appointment request${
                    stats.pendingAppointmentCount === 1 ? "" : "s"
                  } currently need attention.`
                : "There are currently no pending appointment requests."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-between gap-4 sm:w-auto"
            onClick={() =>
              navigate(`${routes.admin}/appointments`)
            }
          >
            Review appointments
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <section aria-labelledby="management-heading" className="space-y-4">
        <div>
          <h2
            id="management-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Manage the system
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Jump directly to the area you need to manage.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ManagementCard
            title="Faculty"
            description="Create and update faculty profiles, departments, and availability."
            actionLabel="Manage faculty"
            primary
            onClick={() => navigate(`${routes.admin}/faculty`)}
            icon={
              <GraduationCap
                className="size-5"
                aria-hidden="true"
              />
            }
          />

          <ManagementCard
            title="Departments"
            description="Create and maintain the academic departments used throughout the system."
            actionLabel="Manage departments"
            onClick={() =>
              navigate(`${routes.admin}/departments`)
            }
            icon={
              <Building2
                className="size-5"
                aria-hidden="true"
              />
            }
          />

          <ManagementCard
            title="Appointments"
            description="Review appointment requests and monitor appointments across the system."
            actionLabel="View appointments"
            onClick={() =>
              navigate(`${routes.admin}/appointments`)
            }
            icon={
              <CalendarDays
                className="size-5"
                aria-hidden="true"
              />
            }
          />
        </div>
      </section>
    </main>
  )
}
