import type { LucideIcon } from "lucide-react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import { formatPercentChange } from "@/lib/utils/format";

interface DashboardKpiCardProps {
  title: string;
  value: string;
  changePercent: number | null;
  badgeLabel: string;
  icon: LucideIcon;
  tone?: "green" | "red" | "blue";
  isLoading?: boolean;
  footer?: string;
  miniChartData?: number[];
}

const toneStyles = {
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
    change: "text-emerald-600",
    bar: "bg-emerald-400",
  },
  red: {
    icon: "bg-rose-50 text-rose-600",
    badge: "bg-rose-50 text-rose-700",
    change: "text-rose-600",
    bar: "bg-rose-400",
  },
  blue: {
    icon: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
    change: "text-sky-600",
    bar: "bg-sky-400",
  },
};

function MiniBarChart({ data, barClassName }: { data: number[]; barClassName: string }) {
  const max = Math.max(...data.map(Math.abs), 1);

  return (
    <div className="flex h-12 items-end justify-end gap-1">
      {data.map((point, index) => {
        const height = Math.max(4, (Math.abs(point) / max) * 100);

        return (
          <span
            className={cn("w-1.5 rounded-full opacity-80", barClassName)}
            key={`${index}-${point}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

export function DashboardKpiCard({
  title,
  value,
  changePercent,
  badgeLabel,
  icon: Icon,
  tone = "blue",
  isLoading,
  footer,
  miniChartData,
}: DashboardKpiCardProps) {
  const styles = toneStyles[tone];

  if (isLoading) {
    return (
      <div className="surface flex h-full min-h-[140px] flex-col p-4">
        <LoadingSkeleton className="h-10 w-10 rounded-xl" />
        <LoadingSkeleton className="mt-3 h-4 w-24" />
        <LoadingSkeleton className="mt-2 h-8 w-28" />
        <LoadingSkeleton className="mt-auto h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="surface flex h-full min-h-[140px] flex-col p-4">
      <div className="flex">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles.icon)}>
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-3 px-4 text-sm text-muted-foreground">{title}</p>
      </div>

      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {miniChartData?.length ? (
          <MiniBarChart barClassName={styles.bar} data={miniChartData} />
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <p className={cn("text-xs sm:text-sm", styles.change)}>
          {footer ?? formatPercentChange(changePercent)}
        </p>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", styles.badge)}>
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}
