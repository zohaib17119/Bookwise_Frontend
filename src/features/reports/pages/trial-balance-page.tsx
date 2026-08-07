import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { ReportFilterBar } from "@/components/accounting/report-filter-bar";
import { ReportPageLayout } from "@/components/accounting/report-page-layout";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ExportActions } from "@/components/shared/export-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { useTrialBalanceReport } from "@/features/reports/hooks/use-reports";
import { defaultMonthToTodayRange } from "@/features/reports/types/ledger-report.types";
import type { ReportFilterParams, ReportRow } from "@/features/reports/types/report.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

function buildDefaultFilters(): ReportFilterParams {
  const range = defaultMonthToTodayRange();
  return {
    fromDate: range.fromDate,
    toDate: range.toDate,
    postedOnly: true,
  };
}

export function TrialBalancePage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const [filters, setFilters] = useState<ReportFilterParams>(buildDefaultFilters);
  const query = useTrialBalanceReport(companyId, filters);
  const currencyCode = query.data?.currencyCode ?? getCompanyBaseCurrency(company);
  const rows = query.data?.rows ?? [];

  const columns: DataTableColumn<ReportRow>[] = useMemo(
    () => [
      {
        key: "account",
        header: "Account",
        render: (row) => row.label || "—",
      },
      {
        key: "debit",
        header: "Debit",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">
            {row.debit ? formatCurrency(row.debit, currencyCode) : "—"}
          </span>
        ),
      },
      {
        key: "credit",
        header: "Credit",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">
            {row.credit ? formatCurrency(row.credit, currencyCode) : "—"}
          </span>
        ),
      },
    ],
    [currencyCode],
  );

  if (!canView) {
    return (
      <ErrorState
        description="Your current company membership does not include report visibility."
        title="Report access restricted"
      />
    );
  }

  return (
    <ReportPageLayout
      actions={<ExportActions onExport={async () => undefined} />}
      content={
        query.error ? (
          <ErrorState description={query.error.message} title="Unable to load report" />
        ) : !rows.length && !query.isLoading ? (
          <EmptyState
            description="Adjust the date range or confirm there is posted activity."
            title="No trial balance rows"
          />
        ) : (
          <div className="space-y-4">
            {query.data?.totals ? (
              <div className="flex flex-wrap gap-6 text-sm">
                {Object.entries(query.data.totals).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">{key}</p>
                    <p className="font-medium tabular-nums">
                      {typeof value === "boolean"
                        ? value
                          ? "✓ Balanced"
                          : "✗ Unbalanced"
                        : typeof value === "string" &&
                            (value.startsWith("✓") || value.startsWith("✗"))
                          ? value
                          : formatCurrency(value ?? "0", currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <DataTable
              columns={columns}
              data={rows}
              emptyDescription="No accounts matched this period."
              emptyTitle="No rows"
              getRowKey={(row) => String(row.label)}
              isLoading={query.isLoading}
            />
          </div>
        )
      }
      description="Period trial balance with debit and credit columns per account."
      eyebrow="Reports"
      filters={
        <ReportFilterBar
          actions={
            <>
              <Button
                onClick={() => setFilters(buildDefaultFilters())}
                type="button"
                variant="secondary"
              >
                Reset
              </Button>
              <Button onClick={() => void query.refetch()} type="button">
                Refresh
              </Button>
            </>
          }
        >
          <DateRangeToolbar
            fromDate={filters.fromDate ?? ""}
            onFromDateChange={(fromDate) =>
              setFilters((current) => ({ ...current, fromDate: fromDate || undefined }))
            }
            onToDateChange={(toDate) =>
              setFilters((current) => ({ ...current, toDate: toDate || undefined }))
            }
            toDate={filters.toDate ?? ""}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={Boolean(filters.postedOnly)}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  postedOnly: event.target.checked,
                }))
              }
            />
            Posted only
          </label>
        </ReportFilterBar>
      }
      title="Trial Balance"
    />
  );
}
