import { CalendarDays } from "lucide-react";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { formatShortDateRange } from "@/lib/utils/format";
import type { SalesPerson } from "@/features/sales-persons/types/sales-person.types";

interface DashboardHeaderProps {
  companyName: string;
  userName?: string;
  fromDate: string;
  toDate: string;
  previousFromDate: string;
  previousToDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  salesPersons?: SalesPerson[];
  selectedSalesPersonIds?: string[];
  onSalesPersonIdsChange?: (ids: string[]) => void;
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
  salesPersons = [],
  selectedSalesPersonIds = [],
  onSalesPersonIdsChange,
}: DashboardHeaderProps) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? "there";

  const toggleSalesPerson = (id: string) => {
    if (!onSalesPersonIdsChange) return;
    if (selectedSalesPersonIds.includes(id)) {
      onSalesPersonIdsChange(selectedSalesPersonIds.filter((x) => x !== id));
    } else {
      onSalesPersonIdsChange([...selectedSalesPersonIds, id]);
    }
  };

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
        {onSalesPersonIdsChange ? (
          <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sales persons
              </p>
              {selectedSalesPersonIds.length > 0 ? (
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={() => onSalesPersonIdsChange([])}
                  type="button"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              None selected = all sales. Select one or more to filter revenue, COGS, and gross
              profit.
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {salesPersons.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sales persons yet.</p>
              ) : (
                salesPersons.map((sp) => {
                  const checked = selectedSalesPersonIds.includes(sp.id);
                  return (
                    <label
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-slate-50"
                      key={sp.id}
                    >
                      <input
                        checked={checked}
                        className="h-4 w-4"
                        onChange={() => toggleSalesPerson(sp.id)}
                        type="checkbox"
                      />
                      <span>
                        {sp.name}
                        {sp.isDefault ? (
                          <span className="text-xs text-muted-foreground"> (default)</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
