import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useBalanceSheetReport } from "@/features/reports/hooks/use-reports";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function BalanceSheetPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useBalanceSheetReport(companyId, filters);

  return (
    <ReportView
      description="View assets, liabilities, and equity as of a point in time."
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Balance Sheet"
      usesAsOfDate
    />
  );
}
