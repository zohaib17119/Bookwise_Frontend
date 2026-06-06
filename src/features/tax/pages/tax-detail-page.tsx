import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useTaxDetailReport } from "@/features/tax/hooks/use-tax";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function TaxDetailPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useTaxDetailReport(companyId, filters);

  return (
    <ReportView
      description="Review line-level tax detail by document, code, and reporting period."
      eyebrow="Tax"
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      title="Tax Detail Report"
    />
  );
}
