import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { ReportRow } from "@/features/reports/types/report.types";
import { formatCurrency } from "@/lib/utils/format";
import { parseMoney } from "@/lib/utils/money";

interface AgingReportTableProps {
  rows: ReportRow[];
  currencyCode: string;
  partyHeader: string;
  isLoading?: boolean;
}

function money(value: unknown, currencyCode: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (parseMoney(value) === 0) return "—";
  return formatCurrency(value as string | number, currencyCode);
}

export function AgingReportTable({
  rows,
  currencyCode,
  partyHeader,
  isLoading = false,
}: AgingReportTableProps) {
  const columns: DataTableColumn<ReportRow>[] = [
    {
      key: "party",
      header: partyHeader,
      render: (row) => row.label || "—",
    },
    {
      key: "current",
      header: "Current",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{money(row.Current, currencyCode)}</span>
      ),
    },
    {
      key: "b1",
      header: "1–30",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{money(row["1-30"], currencyCode)}</span>
      ),
    },
    {
      key: "b2",
      header: "31–60",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{money(row["31-60"], currencyCode)}</span>
      ),
    },
    {
      key: "b3",
      header: "61–90",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{money(row["61-90"], currencyCode)}</span>
      ),
    },
    {
      key: "b4",
      header: "91+",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{money(row["91+"], currencyCode)}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums font-medium">
          {money(row.value, currencyCode)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyDescription="No open balances matched the as-of date."
      emptyTitle="No aging rows"
      getRowKey={(row) => String(row.label)}
      isLoading={isLoading}
    />
  );
}
