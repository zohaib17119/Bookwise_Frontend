import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronsUpDown, X } from "lucide-react";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { Button } from "@/components/ui/button";
import { formatShortDateRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleSalesPerson = (id: string) => {
    if (!onSalesPersonIdsChange) return;
    if (selectedSalesPersonIds.includes(id)) {
      onSalesPersonIdsChange(selectedSalesPersonIds.filter((x) => x !== id));
    } else {
      onSalesPersonIdsChange([...selectedSalesPersonIds, id]);
    }
  };

  const selectedNames = salesPersons
    .filter((sp) => selectedSalesPersonIds.includes(sp.id))
    .map((sp) => sp.name);

  const triggerLabel =
    selectedNames.length === 0
      ? "All sales persons"
      : selectedNames.length === 1
        ? selectedNames[0]
        : `${selectedNames.length} selected`;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{companyName} dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back, {firstName}! Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 lg:max-w-3xl lg:items-end">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {formatShortDateRange(fromDate, toDate)}
            {" vs "}
            {formatShortDateRange(previousFromDate, previousToDate)}
          </span>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:justify-end">
          <DateRangeToolbar
            fromDate={fromDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            toDate={toDate}
          />

          {onSalesPersonIdsChange ? (
            <div className="relative min-w-[200px] sm:min-w-[220px]" ref={dropdownRef}>
              <button
                aria-expanded={open}
                aria-haspopup="listbox"
                className={cn(
                  "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 text-sm shadow-sm",
                  "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                onClick={() => setOpen((prev) => !prev)}
                type="button"
              >
                <span className="truncate text-left">{triggerLabel}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {selectedSalesPersonIds.length > 0 ? (
                    <span
                      className="rounded p-0.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSalesPersonIdsChange([]);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onSalesPersonIdsChange([]);
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>

              {open ? (
                <div
                  className="absolute right-0 z-40 mt-1 w-full min-w-[240px] overflow-hidden rounded-md border border-border bg-white shadow-lg"
                  role="listbox"
                >
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <p className="text-xs text-muted-foreground">Multi-select</p>
                    {selectedSalesPersonIds.length > 0 ? (
                      <Button
                        className="h-auto px-0 py-0 text-xs"
                        onClick={() => onSalesPersonIdsChange([])}
                        type="button"
                        variant="ghost"
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    {salesPersons.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-muted-foreground">No sales persons yet.</p>
                    ) : (
                      salesPersons.map((sp) => {
                        const checked = selectedSalesPersonIds.includes(sp.id);
                        return (
                          <label
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                            key={sp.id}
                          >
                            <input
                              checked={checked}
                              className="h-4 w-4"
                              onChange={() => toggleSalesPerson(sp.id)}
                              type="checkbox"
                            />
                            <span className="truncate">
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
