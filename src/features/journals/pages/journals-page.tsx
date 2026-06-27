import { useDeferredValue, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { JournalStatusBadge } from "@/components/accounting/journal-status-badge";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useJournalEntries } from "@/features/journals/hooks/use-journals";
import type { JournalEntry } from "@/features/journals/types/journal.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function JournalsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "journals");
  const canManage = canManageEntity(permissions, "journals");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sourceModule, setSourceModule] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filters = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      status: status || undefined,
      sourceModule: sourceModule || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [deferredSearch, fromDate, sourceModule, status, toDate],
  );

  const journalsQuery = useJournalEntries(companyId, filters);

  if (!canView) {
    return (
      <ErrorState
        title="Journal access restricted"
        description="Your current company membership does not include journal entry visibility."
      />
    );
  }

  const columns: DataTableColumn<JournalEntry>[] = [
    {
      key: "entryNumber",
      header: "Entry",
      render: (entry) => (
        <div>
          <Link
            className="font-medium text-primary hover:underline"
            to={`/app/company/${companyId}/journals/${entry.id}`}
          >
            {entry.entryNumber || "Draft journal"}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{entry.description || "-"}</p>
        </div>
      ),
    },
    {
      key: "entryDate",
      header: "Date",
      render: (entry) => formatDate(entry.entryDate),
    },
    {
      key: "source",
      header: "Source",
      render: (entry) => entry.sourceModule || "Manual",
    },
    {
      key: "status",
      header: "Status",
      render: (entry) => <JournalStatusBadge status={entry.status} />,
    },
    {
      key: "totals",
      header: "Debit / Credit",
      render: (entry) => {
        const debitTotal = (entry.lines ?? []).reduce(
          (sum, line) => sum + Number(line.debitAmount || 0),
          0,
        );
        const creditTotal = (entry.lines ?? []).reduce(
          (sum, line) => sum + Number(line.creditAmount || 0),
          0,
        );

        return (
          <div className="text-sm">
            {formatCurrency(debitTotal, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD")} /{" "}
            {formatCurrency(creditTotal, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD")}
          </div>
        );
      },
    },
  ];

  return (
    <EntityListPage
      content={
        journalsQuery.error ? (
          <ErrorState
            title="Unable to load journal entries"
            description={journalsQuery.error.message}
          />
        ) : (
          <DataTable
            columns={columns}
            data={journalsQuery.data ?? []}
            emptyDescription="Post manual journals and review source-linked entries from accounting workflows."
            emptyTitle="No journal entries yet"
            getRowKey={(entry) => entry.id}
            isLoading={journalsQuery.isLoading}
          />
        )
      }
      description="Review posted activity, monitor manual entries, and manage draft journals."
      eyebrow="Accounting"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/journals/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New journal
          </Link>
        </Button>
      }
      title="Journal Entries"
      toolbar={
        <FilterBar>
          <SearchInput
            onChange={setSearch}
            placeholder="Search entry number or description"
            value={search}
          />
          <Select
            className="min-w-[160px]"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="VOID">Void</option>
            <option value="REVERSED">Reversed</option>
          </Select>
          <Select
            className="min-w-[160px]"
            onChange={(event) => setSourceModule(event.target.value)}
            value={sourceModule}
          >
            <option value="">All sources</option>
            <option value="manual">Manual</option>
            <option value="sales">Sales</option>
            <option value="purchases">Purchases</option>
            <option value="inventory">Inventory</option>
            <option value="banking">Banking</option>
          </Select>
          <DateRangeToolbar
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            toDate={toDate}
          />
        </FilterBar>
      }
    />
  );
}
