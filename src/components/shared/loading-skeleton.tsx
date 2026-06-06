import { cn } from "@/lib/utils/cn";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/50",
        className,
      )}
    />
  );
}
