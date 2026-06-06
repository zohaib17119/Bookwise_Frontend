import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSelect } from "@/components/accounting/account-select";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { FilterBar } from "@/components/shared/filter-bar";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useLedger } from "@/features/journals/hooks/use-journals";
import type { LedgerRow } from "@/features/journals/types/journal.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function LedgerAccountPage() {
  const { companyId, accountId } = useParams();
  const { company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "reports");
  const accountsQuery = useAccountOptions(companyId);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ledgerQuery = useLedger(companyId, accountId, {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  if (!canView) {
    return (
      <ErrorState
        title="Ledger access restricted"
        description="Your current company membership does not include ledger visibility."
      />
    );
  }

  const columns: DataTableColumn<LedgerRow>[] = [
    {
      key: "date",
      header: "Date",
      render: (row) => formatDate(row.entryDate),
    },
    {
      key: "entry",
      header: "Entry",
      render: (row) => (
        <div>
          <p className="font-medium">{row.entryNumber || "-"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.description || "-"}</p>
        </div>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      render: (row) => formatCurrency(row.debitAmount ?? 0, company?.currency ?? "USD"),
    },
    {
      key: "credit",
      header: "Credit",
      render: (row) => formatCurrency(row.creditAmount ?? 0, company?.currency ?? "USD"),
    },
    {
      key: "balance",
      header: "Running balance",
      render: (row) => formatCurrency(row.runningBalance ?? 0, company?.currency ?? "USD"),
    },
  ];

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/ledger`}>Back to ledger accounts</Link>
            </Button>
          }
          description="Inspect account activity and running balance for the selected period."
          eyebrow="Ledger"
          title="Account Activity"
        />
      }
    >
      <FilterBar>
        <div className="min-w-[280px]">
          <AccountSelect
            label="Account"
            onChange={() => undefined}
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

      {ledgerQuery.error ? (
        <ErrorState title="Unable to load ledger" description={ledgerQuery.error.message} />
      ) : (
        <DataTable
          columns={columns}
          data={ledgerQuery.data ?? []}
          emptyDescription="No postings matched the selected account and date range."
          emptyTitle="No ledger activity"
          getRowKey={(row) => row.id}
          isLoading={ledgerQuery.isLoading}
        />
      )}
    </PageContainer>
  );
}
