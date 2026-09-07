import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Building2,
  GraduationCap,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { routes } from "@/routes/routes"

import { useAdminDashboardStats } from "./admin-queries"

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
          <p className="text-sm font-medium text-muted-foreground">
            Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
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
          <p className="text-sm font-medium text-muted-foreground">
            Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
        </section>

        <ErrorState
          message="Unable to load admin dashboard data."
          onRetry={retry}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Manage faculty, departments, availability, and appointments.
        </p>
      </section>

      <section
        aria-label="System overview"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Faculty
            </p>
            <GraduationCap className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {stats.facultyCount}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Departments
            </p>
            <Building2 className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {stats.departmentCount}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Appointments
            </p>
            <CalendarDays className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {stats.appointmentCount}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Pending
            </p>
            <Users className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {stats.pendingAppointmentCount}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Faculty management</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, update, and manage faculty profiles and availability.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate(`${routes.admin}/faculty`)}
          >
            Manage Faculty
          </Button>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, update, and manage academic departments.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate(`${routes.admin}/departments`)}
          >
            Manage Departments
          </Button>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Appointments</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review appointments across the system.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate(`${routes.admin}/appointments`)}
          >
            View Appointments
          </Button>
        </div>
      </section>
    </main>
  )
}
