import { Link } from "react-router-dom";
import { ReportPageLayout } from "@/components/accounting/report-page-layout";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";

const reportLinks = [
  { segment: "trial-balance", label: "Trial Balance", description: "Check debit and credit position by account." },
  { segment: "general-ledger", label: "General Ledger", description: "Review posting activity by account and date." },
  { segment: "profit-and-loss", label: "Profit and Loss", description: "Summarize income and expense performance." },
  { segment: "balance-sheet", label: "Balance Sheet", description: "View assets, liabilities, and equity balances." },
  { segment: "accounts-receivable-aging", label: "A/R Aging", description: "Analyze outstanding customer balances." },
  { segment: "accounts-payable-aging", label: "A/P Aging", description: "Analyze vendor obligations by aging bucket." },
];

export function ReportsHomePage() {
  const { companyId } = useActiveCompany();

  return (
    <ReportPageLayout
      content={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportLinks.map((report) => (
            <Link
              className="surface block p-5 transition hover:border-primary/40 hover:shadow-sm"
              key={report.segment}
              to={`/app/company/${companyId}/reports/${report.segment}`}
            >
              <h3 className="text-base font-semibold">{report.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
            </Link>
          ))}
        </div>
      }
      description="Run statement-style reports against the current company ledger."
      eyebrow="Reports"
      title="Financial Reports"
    />
  );
}
