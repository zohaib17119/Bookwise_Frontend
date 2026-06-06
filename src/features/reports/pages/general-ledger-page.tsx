import { useState } from "react";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useGeneralLedgerReport } from "@/features/reports/hooks/use-reports";
import { ReportView } from "@/features/reports/components/report-view";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function GeneralLedgerPage() {
  const { companyId } = useActiveCompany();
  const [filters, setFilters] = useState<ReportFilterParams>({ postedOnly: true });
  const query = useGeneralLedgerReport(companyId, filters);

  return (
    <ReportView
      description="Inspect account-level posting detail with date filters and account selection."
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({ postedOnly: true })}
      query={query}
      requiresAccount
      title="General Ledger"
    />
  );
}
