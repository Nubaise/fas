import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { clearAccessToken, getAccessToken, setAccessToken } from "./token-storage"
import { login as loginRequest } from "./auth-api"
import type { AuthenticatedUser, Role } from "./auth.types"

type AuthContextValue = {
  accessToken: string | null
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (role: Role) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

function decodeJwtPayload(token: string): AuthenticatedUser {
  const payload = token.split(".")[1]

  if (!payload) {
    throw new Error("Invalid access token")
  }

  const decoded = JSON.parse(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
  ) as {
    sub?: unknown
    role?: unknown
    exp?: unknown
  }

  if (
    typeof decoded.sub !== "string" ||
    (decoded.role !== "STUDENT" &&
      decoded.role !== "FACULTY" &&
      decoded.role !== "ADMIN")
  ) {
    throw new Error("Invalid access token payload")
  }

  if (
    typeof decoded.exp !== "number" ||
    decoded.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Access token has expired")
  }

  return {
    id: decoded.sub,
    role: decoded.role,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setToken] = useState<string | null>(
    () => getAccessToken(),
  )

  const user = useMemo<AuthenticatedUser | null>(() => {
    if (!accessToken) {
      return null
    }

    try {
      return decodeJwtPayload(accessToken)
    } catch {
      clearAccessToken()
      return null
    }
  }, [accessToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: user !== null,
      login: async (email, password) => {
        const response = await loginRequest({ email, password })

        setAccessToken(response.accessToken)
        setToken(response.accessToken)
      },
      logout: () => {
        clearAccessToken()
        setToken(null)
      },
      hasRole: (role) => user?.role === role,
    }),
    [accessToken, user],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
