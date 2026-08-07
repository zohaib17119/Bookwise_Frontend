import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AccountSelect } from "@/components/accounting/account-select";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { useLedger } from "@/features/journals/hooks/use-journals";
import { LedgerReportTable } from "@/features/reports/components/ledger-report-table";
import { defaultMonthToTodayRange } from "@/features/reports/types/ledger-report.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

export function LedgerAccountPage() {
  const navigate = useNavigate();
  const { companyId, accountId } = useParams();
  const { company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const accountsQuery = useAccountOptions(companyId);
  const defaultRange = useMemo(() => defaultMonthToTodayRange(), []);
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const ledgerQuery = useLedger(companyId, accountId, {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const currencyCode = getCompanyBaseCurrency(company);
  const ledger = ledgerQuery.data;
  const entries = (ledger?.lines ?? []).map((line) => ({
    journalEntryId: line.id,
    entryDate: String(line.entryDate ?? ""),
    entryNumber: line.entryNumber,
    voucherType: String(line.voucherType ?? "Journal"),
    voucherNumber: String(line.voucherNumber ?? line.entryNumber ?? "—"),
    description: line.description,
    debitAmount: String(line.debitAmount ?? "0.00"),
    creditAmount: String(line.creditAmount ?? "0.00"),
    runningBalance: String(line.runningBalance ?? "0.00"),
  }));

  if (!canView) {
    return (
      <ErrorState
        description="Your current company membership does not include ledger visibility."
        title="Ledger access restricted"
      />
    );
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/ledger`}>Back to ledger accounts</Link>
            </Button>
          }
          description="Account activity with voucher details, debit, credit, and running balance."
          eyebrow="Ledger"
          title={
            ledger?.account
              ? `${ledger.account.code} — ${ledger.account.name}`
              : "Account Activity"
          }
        />
      }
    >
      <FilterBar>
        <div className="min-w-[280px]">
          <AccountSelect
            label="Account"
            onChange={(nextId) => {
              if (nextId) {
                navigate(`/app/company/${companyId}/ledger/${nextId}`);
              }
            }}
            options={accountsQuery.data ?? []}
            value={accountId ?? ""}
          />
        </div>
        <DateRangeToolbar
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          toDate={toDate}
        />
      </FilterBar>

      {ledger?.summary ? (
        <div className="mb-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Opening</p>
            <p className="font-medium tabular-nums">
              {formatCurrency(ledger.summary.openingBalance ?? "0", currencyCode)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Closing</p>
            <p className="font-medium tabular-nums">
              {formatCurrency(ledger.summary.closingBalance ?? "0", currencyCode)}
            </p>
          </div>
        </div>
      ) : null}

      {ledgerQuery.error ? (
        <ErrorState description={ledgerQuery.error.message} title="Unable to load ledger" />
      ) : (
        <LedgerReportTable
          currencyCode={currencyCode}
          entries={entries}
          isLoading={ledgerQuery.isLoading}
        />
      )}
    </PageContainer>
  );
}
