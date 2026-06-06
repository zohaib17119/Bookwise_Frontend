import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useTrialBalanceReport } from "@/features/reports/hooks/use-reports";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function TrialBalancePage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useTrialBalanceReport(companyId, filters);

  return (
    <ReportView
      description="Verify the period trial balance before month-end close and statement generation."
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Trial Balance"
    />
  );
}
