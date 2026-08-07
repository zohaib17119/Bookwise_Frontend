import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AccountSelect } from "@/components/accounting/account-select";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { ReportFilterBar } from "@/components/accounting/report-filter-bar";
import { ReportPageLayout } from "@/components/accounting/report-page-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ExportActions } from "@/components/shared/export-actions";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { LedgerReportTable } from "@/features/reports/components/ledger-report-table";
import { useGeneralLedgerReport } from "@/features/reports/hooks/use-reports";
import { defaultMonthToTodayRange } from "@/features/reports/types/ledger-report.types";
import type { ReportFilterParams } from "@/features/reports/types/report.types";
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

export function GeneralLedgerPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const accountOptionsQuery = useAccountOptions(companyId);
  const [filters, setFilters] = useState<ReportFilterParams>(buildDefaultFilters);
  const query = useGeneralLedgerReport(companyId, filters);

  const currencyCode =
    query.data?.currencyCode ?? getCompanyBaseCurrency(company);
  const accounts = query.data?.accounts ?? [];

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
        ) : query.isLoading ? (
          <div className="surface p-6 text-sm text-muted-foreground">Loading report...</div>
        ) : !accounts.length ? (
          <EmptyState
            description="Adjust the date range or account filter, or confirm there is posted activity."
            title="No ledger activity"
          />
        ) : (
          <div className="space-y-6">
            {accounts.map((section) => (
              <section className="surface overflow-hidden" key={section.account.id}>
                <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">
                      {section.account.code} — {section.account.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.entries.length} posting
                      {section.entries.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {section.summary ? (
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Opening</p>
                        <p className="font-medium tabular-nums">
                          {formatCurrency(section.summary.openingBalance ?? 0, currencyCode)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Closing</p>
                        <p className="font-medium tabular-nums">
                          {formatCurrency(section.summary.closingBalance ?? 0, currencyCode)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="p-3 sm:p-4">
                  <LedgerReportTable
                    currencyCode={currencyCode}
                    entries={section.entries}
                    isLoading={false}
                  />
                </div>
              </section>
            ))}
          </div>
        )
      }
      description="Standard ledger with debit, credit, and running balance by account. Leave account blank to show all accounts."
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
          <div className="min-w-[240px] flex-1">
            <AccountSelect
              label="Account (optional)"
              onChange={(accountId) =>
                setFilters((current) => ({
                  ...current,
                  accountId: accountId || undefined,
                }))
              }
              options={accountOptionsQuery.data ?? []}
              placeholder="All accounts"
              value={filters.accountId ?? ""}
            />
          </div>
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
      title="General Ledger"
    />
  );
}
