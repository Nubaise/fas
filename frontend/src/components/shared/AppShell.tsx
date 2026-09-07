import {
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react"
import { useState } from "react"
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/auth/AuthProvider"
import { useTheme } from "@/app/providers/ThemeProvider"
import { cn } from "cn"

type NavigationItem = {
  label: string
  description: string
  href: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const navigationByRole = {
  STUDENT: [
    {
      label: "Dashboard",
      description: "Your appointment overview",
      href: "/student",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Find Faculty",
      description: "Browse faculty and departments",
      href: "/student/faculty",
      icon: Users,
    },
    {
      label: "Appointments",
      description: "View your appointments",
      href: "/student/appointments",
      icon: CalendarDays,
    },
  ],
  FACULTY: [
    {
      label: "Dashboard",
      description: "Your faculty overview",
      href: "/faculty",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Appointments",
      description: "Manage appointment requests",
      href: "/faculty/appointments",
      icon: CalendarDays,
    },
    {
      label: "Availability",
      description: "Set your booking hours",
      href: "/faculty/availability",
      icon: Clock3,
    },
    {
      label: "Profile",
      description: "Manage your profile",
      href: "/faculty/profile",
      icon: CircleUserRound,
    },
  ],
  ADMIN: [
    {
      label: "Dashboard",
      description: "System overview",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Faculty",
      description: "Manage faculty",
      href: "/admin/faculty",
      icon: Users,
    },
    {
      label: "Departments",
      description: "Manage departments",
      href: "/admin/departments",
      icon: GraduationCap,
    },
    {
      label: "Appointments",
      description: "View appointments",
      href: "/admin/appointments",
      icon: CalendarDays,
    },
  ],
} satisfies Record<
  "STUDENT" | "FACULTY" | "ADMIN",
  NavigationItem[]
>

function getRoleLabel(role: "STUDENT" | "FACULTY" | "ADMIN") {
  switch (role) {
    case "STUDENT":
      return "Student"
    case "FACULTY":
      return "Faculty"
    case "ADMIN":
      return "Administrator"
  }
}

function getRoleDescription(role: "STUDENT" | "FACULTY" | "ADMIN") {
  switch (role) {
    case "STUDENT":
      return "Student workspace"
    case "FACULTY":
      return "Faculty workspace"
    case "ADMIN":
      return "Administration workspace"
  }
}

function ThemeIcon({
  theme,
}: {
  theme: "dark" | "light" | "system"
}) {
  if (theme === "dark") {
    return <Moon className="size-4" aria-hidden="true" />
  }

  return <Sun className="size-4" aria-hidden="true" />
}

function ThemeMenu({
  theme,
  onChange,
}: {
  theme: "dark" | "light" | "system"
  onChange: (theme: "dark" | "light" | "system") => void
}) {
  const [open, setOpen] = useState(false)

  const options = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
    },
    {
      value: "system" as const,
      label: "System",
      icon: Sun,
    },
  ]

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Change appearance"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeIcon theme={theme} />
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close appearance menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            aria-label="Appearance"
            className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {options.map((option) => {
              const Icon = option.icon
              const active = theme === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitem"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    "hover:bg-muted",
                    active &&
                      "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function UserMenu({
  role,
  onLogout,
}: {
  role: "STUDENT" | "FACULTY" | "ADMIN"
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        className="h-9 gap-2 px-2"
        aria-label="Open account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleUserRound
            className="size-4"
            aria-hidden="true"
          />
        </span>

        <span className="hidden text-left sm:block">
          <span className="block text-xs font-medium leading-none">
            {getRoleLabel(role)}
          </span>
        </span>

        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-medium">
                {getRoleLabel(role)}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {getRoleDescription(role)}
              </p>
            </div>

            <Separator className="my-1" />

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Settings
                className="size-4"
                aria-hidden="true"
              />
              <span>Account</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
            >
              <LogOut
                className="size-4"
                aria-hidden="true"
              />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Sidebar({
  items,
  role,
  onNavigate,
}: {
  items: NavigationItem[]
  role: "STUDENT" | "FACULTY" | "ADMIN"
  onNavigate?: () => void
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarDays
            className="size-4"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            FAS
          </p>

          <p className="truncate text-[11px] text-muted-foreground">
            Faculty Appointment System
          </p>
        </div>
      </div>

      <div className="px-3 py-4">
        <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {getRoleLabel(role)}
        </div>

        <nav
          aria-label="Primary navigation"
          className="space-y-1"
        >
          {items.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.exact}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all",
                    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )
                }
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors group-hover:bg-background/40">
                  <Icon
                    className="size-4"
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {item.label}
                  </span>

                  <span className="hidden truncate text-[11px] text-muted-foreground lg:block">
                    {item.description}
                  </span>
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto border-t p-3">
        <div className="rounded-lg border bg-background/40 px-3 py-2.5">
          <p className="text-xs font-medium">
            Faculty Appointment System
          </p>

          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Schedule with confidence.
          </p>
        </div>
      </div>
    </aside>
  )
}

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    )
  }

  const items = navigationByRole[user.role]

  const activeItem =
    items.find((item) =>
      item.exact
        ? location.pathname === item.href
        : location.pathname.startsWith(item.href),
    ) ?? items[0]

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden md:flex">
          <Sidebar items={items} role={user.role} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              onClick={() => setMobileOpen(false)}
            />

            <div className="relative z-10 h-full">
              <Sidebar
                items={items}
                role={user.role}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background/95 px-3 supports-backdrop-filter:bg-background/80 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu
                className="size-5"
                aria-hidden="true"
              />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">
                  {activeItem.label}
                </h1>

                <span className="hidden text-xs text-muted-foreground sm:inline">
                  /
                </span>

                <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                  {getRoleDescription(user.role)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ThemeMenu
                theme={theme}
                onChange={setTheme}
              />

              <UserMenu
                role={user.role}
                onLogout={handleLogout}
              />
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-360 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed right-3 top-3 z-[60] flex size-8 items-center justify-center rounded-lg border bg-background shadow-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
