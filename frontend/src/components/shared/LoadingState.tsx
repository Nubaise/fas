import { Skeleton } from "@/components/ui/skeleton"

type LoadingStateProps = {
  className?: string
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={className} role="status" aria-label="Loading">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
