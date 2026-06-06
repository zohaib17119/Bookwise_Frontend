import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SectionCard } from "@/components/shared/section-card";
import { formatCurrency, formatTrendDate } from "@/lib/utils/format";

interface ChartPoint {
  date: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  description?: string;
  color: string;
  data: ChartPoint[];
  currency: string;
  isLoading?: boolean;
  errorMessage?: string;
}

export function ChartCard({
  title,
  description,
  color,
  data,
  currency,
  isLoading,
  errorMessage,
}: ChartCardProps) {
  return (
    <SectionCard title={title} description={description}>
      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-4 w-40" />
          <LoadingSkeleton className="h-[260px] w-full" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Chart unavailable"
          description={errorMessage}
        />
      ) : data.length ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`${title}-gradient`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe5ef" />
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={(value: string) => formatTrendDate(value)}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value, currency)}
                tickLine={false}
                width={92}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, currency)}
                labelFormatter={(label: string) => formatTrendDate(label)}
              />
              <Area
                dataKey="value"
                fill={`url(#${title}-gradient)`}
                fillOpacity={1}
                stroke={color}
                strokeWidth={2.5}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          title="No analytics yet"
          description="This chart area is wired for company analytics and will populate once the backend returns trend data."
        />
      )}
    </SectionCard>
  );
}
