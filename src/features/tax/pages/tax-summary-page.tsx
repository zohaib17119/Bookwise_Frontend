import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { ReportFilterBar } from "@/components/accounting/report-filter-bar";
import { ReportPageLayout } from "@/components/accounting/report-page-layout";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ExportActions } from "@/components/shared/export-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { defaultMonthToTodayRange } from "@/features/reports/types/ledger-report.types";
import type { ReportFilterParams } from "@/features/reports/types/report.types";
import { TaxModuleNav } from "@/features/tax/components/tax-module-nav";
import { useTaxSummaryReport, useWhtSummaryReport } from "@/features/tax/hooks/use-tax";
import type { TaxSummaryRow, WhtSummaryRow } from "@/features/tax/types/tax.types";
import { whtSummaryHeldByLabel } from "@/features/shared/utils/wht-labels";
import { formatCurrency } from "@/lib/utils/format";

function buildDefaultFilters(): ReportFilterParams {
  const range = defaultMonthToTodayRange();
  return {
    fromDate: range.fromDate,
    toDate: range.toDate,
    postedOnly: true,
  };
}

const TOTAL_LABELS: Record<string, string> = {
  salesTaxAmount: "Sales tax",
  purchaseTaxAmount: "Purchase tax",
  netTaxAmount: "Net tax",
};

export function TaxSummaryPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const [filters, setFilters] = useState<ReportFilterParams>(buildDefaultFilters);
  const query = useTaxSummaryReport(companyId, filters);
  const whtQuery = useWhtSummaryReport(companyId, filters);
  const currencyCode = query.data?.currencyCode ?? getCompanyBaseCurrency(company);
  const rows = query.data?.rows ?? [];
  const totals = query.data?.totals;
  const whtRows = whtQuery.data?.rows ?? [];
  const whtTotals = whtQuery.data?.totals;

  const columns: DataTableColumn<TaxSummaryRow>[] = useMemo(
    () => [
      {
        key: "taxCode",
        header: "Tax code",
        render: (row) => (
          <div>
            <p className="font-medium">{row.taxCode}</p>
            <p className="text-xs text-muted-foreground">{row.taxCodeName}</p>
          </div>
        ),
      },
      {
        key: "salesTaxAmount",
        header: "Sales tax",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">{formatCurrency(row.salesTaxAmount, currencyCode)}</span>
        ),
      },
      {
        key: "purchaseTaxAmount",
        header: "Purchase tax",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">
            {formatCurrency(row.purchaseTaxAmount, currencyCode)}
          </span>
        ),
      },
      {
        key: "netTaxAmount",
        header: "Net tax",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">{formatCurrency(row.netTaxAmount, currencyCode)}</span>
        ),
      },
    ],
    [currencyCode],
  );

  const whtColumns: DataTableColumn<WhtSummaryRow>[] = useMemo(
    () => [
      {
        key: "whtType",
        header: "WHT type",
        render: (row) => (
          <span>{row.whtType === "INCOME" ? "Income WHT" : "Sales tax WHT"}</span>
        ),
      },
      {
        key: "whtHeldBy",
        header: "Held by",
        render: (row) => <span>{whtSummaryHeldByLabel(row.whtHeldBy)}</span>,
      },
      {
        key: "documentCount",
        header: "Docs",
        className: "text-right",
        render: (row) => <span className="tabular-nums">{row.documentCount}</span>,
      },
      {
        key: "whtAmountBase",
        header: "WHT (base)",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">{formatCurrency(row.whtAmountBase, currencyCode)}</span>
        ),
      },
      {
        key: "whtSettledAmount",
        header: "Settled",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">
            {formatCurrency(row.whtSettledAmount, currencyCode)}
          </span>
        ),
      },
      {
        key: "whtOutstandingAmount",
        header: "Outstanding",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">
            {formatCurrency(row.whtOutstandingAmount, currencyCode)}
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
            description="Adjust the date range or confirm invoices/bills with tax exist in the period."
            title="No tax summary rows"
          />
        ) : (
          <div className="space-y-4">
            {totals ? (
              <div className="flex flex-wrap gap-6 text-sm">
                {Object.entries(totals).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">
                      {TOTAL_LABELS[key] ?? key}
                    </p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(value ?? "0", currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <DataTable
              columns={columns}
              data={rows}
              emptyDescription="No tax codes matched this period."
              emptyTitle="No rows"
              getRowKey={(row) => row.taxCodeId}
              isLoading={query.isLoading}
            />
            <div className="space-y-3 border-t border-border/70 pt-4">
              <h3 className="text-sm font-semibold">Withholding tax (separate from VAT)</h3>
              {whtTotals ? (
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">WHT base</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(whtTotals.whtAmountBase, currencyCode)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Settled</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(whtTotals.whtSettledAmount, currencyCode)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(whtTotals.whtOutstandingAmount, currencyCode)}
                    </p>
                  </div>
                </div>
              ) : null}
              <DataTable
                columns={whtColumns}
                data={whtRows}
                emptyDescription="No withholding tax documents in this period."
                emptyTitle="No WHT rows"
                getRowKey={(row) => `${row.whtType}-${row.whtHeldBy}`}
                isLoading={whtQuery.isLoading}
              />
            </div>
          </div>
        )
      }
      description="Summarize tax collected, recoverable tax, and net tax payable for the selected period (base currency)."
      eyebrow="Tax"
      filters={
        <div className="space-y-3">
          <TaxModuleNav />
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
          </ReportFilterBar>
        </div>
      }
      title="Tax Summary Report"
    />
  );
}
