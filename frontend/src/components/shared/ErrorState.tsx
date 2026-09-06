import { AlertCircle } from "lucide-react"

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
      className="flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center"
      role="alert"
    >
      <AlertCircle className="size-5" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>

      {onRetry && (
        <button
          type="button"
          className="text-sm font-medium underline underline-offset-4"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  )
}
