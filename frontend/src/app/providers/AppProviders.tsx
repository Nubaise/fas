import type { ReactNode } from "react"
import { AuthProvider } from "@/features/auth/AuthProvider"
import { QueryProvider } from "./QueryProvider"
import { ThemeProvider } from "./ThemeProvider"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fas-theme">
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
