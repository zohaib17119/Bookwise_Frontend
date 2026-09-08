import { CalendarDays } from "lucide-react";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { formatShortDateRange } from "@/lib/utils/format";

interface DashboardHeaderProps {
  companyName: string;
  userName?: string;
  fromDate: string;
  toDate: string;
  previousFromDate: string;
  previousToDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

export function DashboardHeader({
  companyName,
  userName,
  fromDate,
  toDate,
  previousFromDate,
  previousToDate,
  onFromDateChange,
  onToDateChange,
}: DashboardHeaderProps) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? "there";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{companyName} dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back, {firstName}! Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:items-end">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4" />
          <span>
            {formatShortDateRange(fromDate, toDate)}
            {" vs "}
            {formatShortDateRange(previousFromDate, previousToDate)}
          </span>
        </div>
        <DateRangeToolbar
          fromDate={fromDate}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          toDate={toDate}
        />
      </div>
    </div>
  );
}
