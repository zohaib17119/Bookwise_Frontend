import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import type { DashboardFinancialOverviewPoint } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency, formatTrendDate } from "@/lib/utils/format";

interface FinancialOverviewChartProps {
  data: DashboardFinancialOverviewPoint[];
  currency: string;
  isLoading?: boolean;
  periodDays: number;
}

export function FinancialOverviewChart({
  data,
  currency,
  isLoading,
  periodDays,
}: FinancialOverviewChartProps) {
  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Financial Overview</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Last {periodDays} days
        </span>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-[300px] w-full" />
      ) : data.length ? (
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
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
                width={88}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
                labelFormatter={(label: string) => formatTrendDate(label)}
              />
              <Legend />
              <Line
                dataKey="revenue"
                dot={false}
                name="Revenue"
                stroke="#22c55e"
                strokeDasharray="6 4"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="expenses"
                fill="url(#expenseGradient)"
                name="Expenses"
                stroke="#f87171"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="netProfit"
                fill="url(#profitGradient)"
                name="Net Profit"
                stroke="#60a5fa"
                strokeWidth={2}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          description="Financial activity will appear here once posted journal entries exist in this period."
          title="No financial activity yet"
        />
      )}
    </div>
  );
}
