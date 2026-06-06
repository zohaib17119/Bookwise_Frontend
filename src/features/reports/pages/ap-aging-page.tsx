import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useApAgingReport } from "@/features/reports/hooks/use-reports";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function ApAgingPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useApAgingReport(companyId, filters);

  return (
    <ReportView
      description="Analyze outstanding payables by aging bucket for vendor payment planning."
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Accounts Payable Aging"
      usesAsOfDate
    />
  );
}
