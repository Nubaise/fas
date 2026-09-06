import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthProvider"
import type { Role } from "@/features/auth/auth.types"

type RoleRouteProps = {
  allowedRoles: Role[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
