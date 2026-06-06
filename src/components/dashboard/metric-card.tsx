import { TrendingDown, TrendingUp } from "lucide-react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  trendLabel?: string;
  trendDirection?: "up" | "down" | "neutral";
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  description,
  trendLabel,
  trendDirection = "neutral",
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="surface p-5">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="mt-4 h-10 w-32" />
        <LoadingSkeleton className="mt-4 h-4 w-40" />
      </div>
    );
  }

  return (
    <div className="surface p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        {trendLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              trendDirection === "up" && "bg-emerald-50 text-emerald-700",
              trendDirection === "down" && "bg-rose-50 text-rose-700",
              trendDirection === "neutral" && "bg-secondary text-secondary-foreground",
            )}
          >
            {trendDirection === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trendDirection === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {trendLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
