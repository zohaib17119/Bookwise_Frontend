import type { PropsWithChildren, ReactNode } from "react";
import { FilterBar } from "@/components/shared/filter-bar";

interface ReportFilterBarProps extends PropsWithChildren {
  actions?: ReactNode;
}

export function ReportFilterBar({
  children,
  actions,
}: ReportFilterBarProps) {
  return <FilterBar actions={actions}>{children}</FilterBar>;
}
