import type { ReactNode } from "react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  getRowKey: (row: T) => string;
  pagination?: DataTablePagination;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyTitle,
  emptyDescription,
  getRowKey,
  pagination,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="surface p-6">
        <div className="space-y-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        description={emptyDescription}
        title={emptyTitle}
      />
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/60">
            <tr>
              {columns.map((column) => (
                <th
                  className={cn(
                    "px-4 py-3 font-medium text-muted-foreground",
                    column.className,
                  )}
                  key={column.key}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                className="border-t border-border/70 align-top"
                key={getRowKey(row)}
              >
                {columns.map((column) => (
                  <td className={cn("px-4 py-4", column.className)} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination ? <DataTablePaginationControls pagination={pagination} /> : null}
    </div>
  );
}

function DataTablePaginationControls({
  pagination,
}: {
  pagination: DataTablePagination;
}) {
  const { page, totalPages, total, limit, onPageChange, onLimitChange } = pagination;
  const pageSizeOptions = pagination.pageSizeOptions ?? [10, 25, 50, 100];

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span>
          {from}-{to} of {total}
        </span>
        {onLimitChange ? (
          <label className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
              onChange={(event) => onLimitChange(Number(event.target.value))}
              value={limit}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-border px-3 py-1 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <span className="px-1">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          className="rounded-md border border-border px-3 py-1 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
