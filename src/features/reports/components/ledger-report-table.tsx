import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { LedgerReportEntry } from "@/features/reports/types/ledger-report.types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { parseMoney } from "@/lib/utils/money";

interface LedgerReportTableProps {
  entries: LedgerReportEntry[];
  currencyCode: string;
  isLoading?: boolean;
}

function amountCell(value: string | number, currencyCode: string) {
  if (parseMoney(value) === 0) return "—";
  return formatCurrency(value, currencyCode);
}

export function LedgerReportTable({
  entries,
  currencyCode,
  isLoading = false,
}: LedgerReportTableProps) {
  const columns: DataTableColumn<LedgerReportEntry>[] = [
    {
      key: "date",
      header: "Date",
      render: (row) => formatDate(row.entryDate),
    },
    {
      key: "voucherType",
      header: "Voucher Type",
      render: (row) => row.voucherType || "—",
    },
    {
      key: "voucherNumber",
      header: "Voucher No",
      render: (row) => row.voucherNumber || "—",
    },
    {
      key: "description",
      header: "Description",
      render: (row) => row.description || "—",
    },
    {
      key: "debit",
      header: "Debit",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{amountCell(row.debitAmount, currencyCode)}</span>
      ),
    },
    {
      key: "credit",
      header: "Credit",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{amountCell(row.creditAmount, currencyCode)}</span>
      ),
    },
    {
      key: "balance",
      header: "Running Balance",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.runningBalance ?? 0, currencyCode)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={entries}
      emptyDescription="No postings in this period for the selected filters."
      emptyTitle="No ledger activity"
      getRowKey={(row) =>
        `${row.journalEntryId ?? "row"}-${row.entryDate}-${row.voucherNumber}-${row.debitAmount}-${row.creditAmount}-${row.runningBalance}`
      }
      isLoading={isLoading}
    />
  );
}
