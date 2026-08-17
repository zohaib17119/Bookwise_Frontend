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
import { useTaxDetailReport } from "@/features/tax/hooks/use-tax";
import type { TaxDetailRow } from "@/features/tax/types/tax.types";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function buildDefaultFilters(): ReportFilterParams {
  const range = defaultMonthToTodayRange();
  return {
    fromDate: range.fromDate,
    toDate: range.toDate,
    postedOnly: true,
  };
}

export function TaxDetailPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const [filters, setFilters] = useState<ReportFilterParams>(buildDefaultFilters);
  const query = useTaxDetailReport(companyId, filters);
  const currencyCode = query.data?.currencyCode ?? getCompanyBaseCurrency(company);
  const rows = query.data?.rows ?? [];

  const columns: DataTableColumn<TaxDetailRow>[] = useMemo(
    () => [
      {
        key: "documentDate",
        header: "Date",
        render: (row) => formatDate(row.documentDate),
      },
      {
        key: "sourceNumber",
        header: "Document",
        render: (row) => (
          <div>
            <p className="font-medium">{row.sourceNumber}</p>
            <p className="text-xs text-muted-foreground">
              {row.direction} · {row.sourceModule}
            </p>
          </div>
        ),
      },
      {
        key: "counterpartyName",
        header: "Party",
        render: (row) => row.counterpartyName || "—",
      },
      {
        key: "taxCode",
        header: "Tax code",
        render: (row) => (
          <div>
            <p className="font-medium">{row.taxCode}</p>
            <p className="text-xs text-muted-foreground">{row.taxRate}%</p>
          </div>
        ),
      },
      {
        key: "taxableAmount",
        header: "Taxable",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">{formatCurrency(row.taxableAmount, currencyCode)}</span>
        ),
      },
      {
        key: "taxAmount",
        header: "Tax",
        className: "text-right",
        render: (row) => (
          <span className="tabular-nums">{formatCurrency(row.taxAmount, currencyCode)}</span>
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
            title="No tax detail rows"
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            emptyDescription="No tax lines matched this period."
            emptyTitle="No rows"
            getRowKey={(row) =>
              `${row.sourceModule}-${row.sourceId}-${row.taxCodeId}-${row.documentDate}-${row.taxAmount}`
            }
            isLoading={query.isLoading}
          />
        )
      }
      description="Line-level tax detail by document and tax code (amounts in base currency)."
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
      title="Tax Detail Report"
    />
  );
}
