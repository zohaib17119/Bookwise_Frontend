import type { LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import type { DashboardSparklinePoint } from "@/features/dashboard/types/dashboard.types";
import { cn } from "@/lib/utils/cn";

interface BalanceSparklineCardProps {
  title: string;
  value: string;
  subtitle: string;
  data: DashboardSparklinePoint[];
  icon: LucideIcon;
  tone?: "green" | "blue" | "red";
  isLoading?: boolean;
}

const toneStyles = {
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    stroke: "#22c55e",
    fill: "rgba(34, 197, 94, 0.18)",
  },
  blue: {
    icon: "bg-sky-50 text-sky-600",
    stroke: "#60a5fa",
    fill: "rgba(96, 165, 250, 0.18)",
  },
  red: {
    icon: "bg-rose-50 text-rose-600",
    stroke: "#f87171",
    fill: "rgba(248, 113, 113, 0.18)",
  },
};

export function BalanceSparklineCard({
  title,
  value,
  subtitle,
  data,
  icon: Icon,
  tone = "blue",
  isLoading,
}: BalanceSparklineCardProps) {
  const styles = toneStyles[tone];

  if (isLoading) {
    return (
      <div className="surface p-4">
        <LoadingSkeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="surface p-4">
      <div className="grid grid-cols-[1fr_120px] items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="h-12 w-full">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <Area
                dataKey="value"
                fill={styles.fill}
                stroke={styles.stroke}
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
