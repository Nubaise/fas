import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"

type LoadingStateProps = {
  className?: string
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 w-full items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-5/6 rounded-lg" />
          <Skeleton className="h-9 w-2/3 rounded-lg" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}
