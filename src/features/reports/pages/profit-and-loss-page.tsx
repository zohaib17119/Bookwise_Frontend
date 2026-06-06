import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useProfitAndLossReport } from "@/features/reports/hooks/use-reports";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function ProfitAndLossPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useProfitAndLossReport(companyId, filters);

  return (
    <ReportView
      description="Review operating performance for the current company over the selected period."
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Profit and Loss"
    />
  );
}
