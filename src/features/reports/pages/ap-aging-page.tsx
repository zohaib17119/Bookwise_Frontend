import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportFilterBar } from "@/components/accounting/report-filter-bar";
import { ReportPageLayout } from "@/components/accounting/report-page-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ExportActions } from "@/components/shared/export-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { AgingReportTable } from "@/features/reports/components/aging-report-table";
import { useApAgingReport } from "@/features/reports/hooks/use-reports";
import { toIsoDateLocal } from "@/features/reports/types/ledger-report.types";
import type { ReportFilterParams } from "@/features/reports/types/report.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

function buildDefaultFilters(): ReportFilterParams {
  return { asOfDate: toIsoDateLocal(new Date()), postedOnly: true };
}

export function ApAgingPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const [filters, setFilters] = useState<ReportFilterParams>(buildDefaultFilters);
  const query = useApAgingReport(companyId, filters);
  const currencyCode = query.data?.currencyCode ?? getCompanyBaseCurrency(company);
  const rows = query.data?.rows ?? [];

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
            description="No open payables as of the selected date."
            title="No AP aging rows"
          />
        ) : (
          <div className="space-y-4">
            {query.data?.totals ? (
              <div className="flex flex-wrap gap-6 text-sm">
                {Object.entries(query.data.totals).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">{key}</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(value ?? "0", currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <AgingReportTable
              currencyCode={currencyCode}
              isLoading={query.isLoading}
              partyHeader="Vendor"
              rows={rows}
            />
          </div>
        )
      }
      description="Open payables by aging bucket (Current, 1–30, 31–60, 61–90, 91+)."
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
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <Input
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  asOfDate: event.target.value || undefined,
                }))
              }
              type="date"
              value={filters.asOfDate ?? ""}
            />
          </div>
        </ReportFilterBar>
      }
      title="Accounts Payable Aging"
    />
  );
}
