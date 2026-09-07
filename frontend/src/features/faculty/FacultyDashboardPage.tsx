import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useAuth } from "@/features/auth/AuthProvider"
import { useAppointmentsQuery } from "@/features/appointments/appointment-queries"
import { useFacultyQuery } from "./faculty-queries"
import { routes } from "@/routes/routes"

export function FacultyDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const facultyQuery = useFacultyQuery()
  const appointmentsQuery = useAppointmentsQuery()

  const faculty = useMemo(
    () => facultyQuery.data?.find((item) => item.userId === user?.id),
    [facultyQuery.data, user?.id],
  )

  if (facultyQuery.isLoading || appointmentsQuery.isLoading) {
    return <LoadingState />
  }

  if (facultyQuery.isError || appointmentsQuery.isError) {
    return (
      <ErrorState message="Unable to load your faculty dashboard." />
    )
  }

  if (!faculty) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Faculty Portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Faculty profile not found
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Your account is authenticated as faculty, but no faculty profile
            could be found.
          </p>
        </section>
      </main>
    )
  }

  const appointments = appointmentsQuery.data ?? []
  const today = new Date().toISOString().slice(0, 10)

  const todaysAppointments = appointments.filter(
    (appointment) => appointment.startTime.slice(0, 10) === today,
  )

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "PENDING",
  )

  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.status === "CONFIRMED" &&
        new Date(appointment.startTime).getTime() >= Date.now(),
    )
    .slice(0, 5)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Faculty Portal
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {faculty.firstName}
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Manage your availability, appointment requests, and upcoming
          meetings.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Today's appointments
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {todaysAppointments.length}
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Pending requests
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {pendingAppointments.length}
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Upcoming confirmed
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {upcomingAppointments.length}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Manage availability</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure your weekly schedules and availability exceptions.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate(`${routes.faculty}/availability`)}
          >
            Manage Availability
          </Button>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Appointments</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review appointment requests and manage confirmed appointments.
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate(`${routes.faculty}/appointments`)}
          >
            View Appointments
          </Button>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Your profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View your faculty information and update your name.
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate(`${routes.faculty}/profile`)}
          >
            Edit Profile
          </Button>
        </div>
      </section>

      <section className="rounded-xl border p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Upcoming appointments
          </h2>

          <p className="text-sm text-muted-foreground">
            Your next confirmed appointments.
          </p>
        </div>

        {upcomingAppointments.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No upcoming confirmed appointments.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {upcomingAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() =>
                  navigate(
                    `${routes.faculty}/appointments/${appointment.id}`,
                  )
                }
              >
                <p className="font-medium">
                  {new Date(appointment.startTime).toLocaleString()}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {appointment.reason}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
