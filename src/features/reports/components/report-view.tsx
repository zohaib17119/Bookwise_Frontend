import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { AccountSelect } from "@/components/accounting/account-select";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { ReportFilterBar } from "@/components/accounting/report-filter-bar";
import { ReportPageLayout } from "@/components/accounting/report-page-layout";
import { ReportResultCard } from "@/components/accounting/report-result-card";
import { ExportActions } from "@/components/shared/export-actions";
import { StatementRow } from "@/components/accounting/statement-row";
import { StatementSection } from "@/components/accounting/statement-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import type {
  GenericReportResult,
  ReportFilterParams,
  ReportRow,
} from "@/features/reports/types/report.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

interface ReportViewProps {
  title: string;
  description: string;
  eyebrow?: string;
  requiresAccount?: boolean;
  usesAsOfDate?: boolean;
  filters: ReportFilterParams;
  onFiltersChange: (updater: (current: ReportFilterParams) => ReportFilterParams) => void;
  onReset: () => void;
  query: {
    data?: GenericReportResult;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<unknown>;
  };
}

function formatReportValue(
  row: ReportRow,
  currencyCode: string,
) {
  if (typeof row.value === "number") {
    return formatCurrency(row.value, currencyCode);
  }

  if (typeof row.amount === "number") {
    return formatCurrency(row.amount, currencyCode);
  }

  if (typeof row.balance === "number") {
    return formatCurrency(row.balance, currencyCode);
  }

  if (typeof row.debit === "number" || typeof row.credit === "number") {
    const debit = row.debit ? formatCurrency(row.debit, currencyCode) : "-";
    const credit = row.credit ? formatCurrency(row.credit, currencyCode) : "-";
    return `${debit} / ${credit}`;
  }

  if (typeof row.value === "string") {
    return row.value;
  }

  return "-";
}

export function ReportView({
  title,
  description,
  eyebrow = "Reports",
  requiresAccount = false,
  usesAsOfDate = false,
  filters,
  onFiltersChange,
  onReset,
  query,
}: ReportViewProps) {
  const { companyId, company, permissions } = useActiveCompany();
  const accountOptionsQuery = useAccountOptions(companyId);
  const canView = canViewEntity(permissions, "reports");
  const reportCurrency = getCompanyBaseCurrency(company);

  if (!canView) {
    return (
      <ErrorState
        title="Report access restricted"
        description="Your current company membership does not include report visibility."
      />
    );
  }

  const result = query.data;
  const rows = result?.rows ?? [];
  const sections = result?.sections ?? [];
  const currencyCode = result?.currencyCode ?? reportCurrency;

  return (
    <ReportPageLayout
      actions={<ExportActions onExport={async () => undefined} />}
      content={
        query.error ? (
          <ErrorState
            title="Unable to load report"
            description={query.error.message}
          />
        ) : query.isLoading ? (
          <div className="surface p-6 text-sm text-muted-foreground">Loading report...</div>
        ) : !rows.length && !sections.length ? (
          <EmptyState
            title="No report rows returned"
            description="Adjust the report filters or confirm the backend has matching accounting activity."
          />
        ) : (
          <div className="space-y-4">
            {result?.totals ? (
              <ReportResultCard
                title="Report totals"
                description="Backend-computed summary totals for the current filter set."
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Object.entries(result.totals).map(([key, value]) => (
                    <div className="rounded-xl border border-border/60 px-4 py-3" key={key}>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {typeof value === "number"
                          ? formatCurrency(value, currencyCode)
                          : String(value ?? "-")}
                      </p>
                    </div>
                  ))}
                </div>
              </ReportResultCard>
            ) : null}

            {sections.map((section) => (
              <StatementSection key={section.title} title={section.title}>
                {section.rows.map((row, index) => (
                  <StatementRow
                    depth={row.depth}
                    emphasize={Boolean((row.depth ?? 0) === 0)}
                    key={`${section.title}-${row.label}-${index}`}
                    label={row.label}
                    value={formatReportValue(row, currencyCode)}
                  />
                ))}
              </StatementSection>
            ))}

            {rows.length ? (
              <ReportResultCard title="Statement rows">
                <div className="space-y-2">
                  {rows.map((row, index) => (
                    <StatementRow
                      depth={row.depth}
                      emphasize={Boolean((row.depth ?? 0) === 0)}
                      key={`${row.label}-${index}`}
                      label={row.label}
                      value={formatReportValue(row, currencyCode)}
                    />
                  ))}
                </div>
              </ReportResultCard>
            ) : null}
          </div>
        )
      }
      description={description}
      eyebrow={eyebrow}
      filters={
        <ReportFilterBar
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={() => query.refetch()} type="button" variant="secondary">
                Run report
              </Button>
              <Button onClick={onReset} type="button" variant="ghost">
                Reset
              </Button>
            </div>
          }
        >
          {usesAsOfDate ? (
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <input
                className="flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none"
                onChange={(event) =>
                  onFiltersChange((current) => ({ ...current, asOfDate: event.target.value }))
                }
                type="date"
                value={filters.asOfDate ?? ""}
              />
            </div>
          ) : (
            <DateRangeToolbar
              fromDate={filters.fromDate ?? ""}
              onFromDateChange={(value) =>
                onFiltersChange((current) => ({ ...current, fromDate: value }))
              }
              onToDateChange={(value) =>
                onFiltersChange((current) => ({ ...current, toDate: value }))
              }
              toDate={filters.toDate ?? ""}
            />
          )}

          {requiresAccount ? (
            <div className="w-full sm:w-auto sm:min-w-[260px]">
              <AccountSelect
                label="Account"
                onChange={(value) =>
                  onFiltersChange((current) => ({ ...current, accountId: value || undefined }))
                }
                options={accountOptionsQuery.data ?? []}
                value={filters.accountId ?? ""}
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(filters.postedOnly)}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  postedOnly: event.target.checked,
                }))
              }
            />
            Posted only
          </label>

          {!usesAsOfDate ? (
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                className="w-full"
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    postedOnly: event.target.value !== "all",
                  }))
                }
                value={filters.postedOnly ? "posted" : "all"}
              >
                <option value="posted">Posted entries</option>
                <option value="all">All entries</option>
              </Select>
            </div>
          ) : null}
        </ReportFilterBar>
      }
      title={title}
    />
  );
}
