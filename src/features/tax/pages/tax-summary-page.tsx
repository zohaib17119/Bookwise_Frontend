import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useTaxSummaryReport } from "@/features/tax/hooks/use-tax";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function TaxSummaryPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useTaxSummaryReport(companyId, filters);

  return (
    <ReportView
      description="Summarize tax collected, recoverable tax, and net tax payable for the selected period."
      eyebrow="Tax"
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Tax Summary Report"
    />
  );
}
