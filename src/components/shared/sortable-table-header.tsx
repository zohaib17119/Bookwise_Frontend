import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ListSortDir } from "@/features/shared/types/common";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  activeSortKey?: string;
  sortDir?: ListSortDir;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  className,
}: SortableTableHeaderProps) {
  const active = activeSortKey === sortKey;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      className={cn(
        "inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-foreground",
        active ? "text-foreground" : "",
        className,
      )}
      onClick={() => onSort(sortKey)}
      type="button"
    >
      {label}
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
    </button>
  );
}

export function toggleListSort(
  currentKey: string,
  currentDir: ListSortDir,
  nextKey: string,
): { sortBy: string; sortDir: ListSortDir } {
  if (currentKey !== nextKey) {
    return { sortBy: nextKey, sortDir: "desc" };
  }
  return { sortBy: nextKey, sortDir: currentDir === "desc" ? "asc" : "desc" };
}
