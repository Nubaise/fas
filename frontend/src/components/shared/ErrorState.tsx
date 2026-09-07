import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center"
      role="alert"
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-4" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Unable to load this content</p>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>

      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
