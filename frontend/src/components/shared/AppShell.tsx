import { Menu } from "lucide-react"
import { Outlet } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="font-semibold">FAS</span>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground">
            Faculty Appointment Scheduler
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
