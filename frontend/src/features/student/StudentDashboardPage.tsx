import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { routes } from "@/routes/routes"

export function StudentDashboardPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Student Portal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to FAS</h1>
        <p className="max-w-2xl text-muted-foreground">
          Find faculty, check available appointment slots, and manage your appointments.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Find a faculty member</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse faculty and view their available appointment slots.
          </p>
          <Button className="mt-4" onClick={() => navigate(`${routes.student}/faculty`)}>
            Browse Faculty
          </Button>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">My appointments</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View your appointment requests and their current status.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate(`${routes.student}/appointments`)}
          >
            View Appointments
          </Button>
        </div>
      </section>
    </main>
  )
}
