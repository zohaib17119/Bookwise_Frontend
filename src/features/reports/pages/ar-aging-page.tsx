import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useArAgingReport } from "@/features/reports/hooks/use-reports";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function ArAgingPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useArAgingReport(companyId, filters);

  return (
    <ReportView
      description="Analyze open receivables by aging bucket and overdue concentration."
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Accounts Receivable Aging"
      usesAsOfDate
    />
  );
}
