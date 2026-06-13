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

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  getRowKey: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyTitle,
  emptyDescription,
  getRowKey,
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
    </div>
  );
}
