import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import type { DashboardCashFlowOverview } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/format";

interface CashFlowDonutChartProps {
  data: DashboardCashFlowOverview;
  currency: string;
  isLoading?: boolean;
  periodDays: number;
}

const COLORS = ["#22c55e", "#60a5fa", "#f87171"];

export function CashFlowDonutChart({
  data,
  currency,
  isLoading,
  periodDays,
}: CashFlowDonutChartProps) {
  const segments = [
    { name: "Cash Balance", value: Math.abs(data.cashBalance), raw: data.cashBalance, color: COLORS[0] },
    { name: "Accounts Receivable", value: Math.abs(data.accountsReceivable), raw: data.accountsReceivable, color: COLORS[1] },
    { name: "Accounts Payable", value: Math.abs(data.accountsPayable), raw: data.accountsPayable, color: COLORS[2] },
  ];

  const chartSegments = segments.filter((segment) => segment.value > 0);
  const hasChartData = chartSegments.length > 0;

  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Cash Flow Overview</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Last {periodDays} days
        </span>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-[300px] w-full" />
      ) : hasChartData ? (
        <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-center">
          <div className="relative h-[200px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={chartSegments}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {chartSegments.map((segment) => (
                    <Cell fill={segment.color} key={segment.name} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-lg font-semibold">{formatCurrency(data.netCashFlow, currency)}</p>
              <p className="text-xs text-muted-foreground">Net Cash Flow</p>
            </div>
          </div>

          <div className="space-y-3">
            {segments.map((segment) => (
              <div className="flex items-center justify-between gap-3" key={segment.name}>
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-muted-foreground">{segment.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(segment.raw, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          description="Cash flow segments will appear once balances and open documents exist."
          title="No cash flow data yet"
        />
      )}
    </div>
  );
}
