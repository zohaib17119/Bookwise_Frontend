import { useParams } from "react-router-dom";
import { useCompany } from "@/features/companies/hooks/use-company";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";

export function CompanyDetailPage() {
  const { companyId } = useParams();
  const companyQuery = useCompany(companyId);

  if (companyQuery.isLoading) {
    return <LoadingState title="Loading company" description="Pulling company profile and summary information." />;
  }

  if (companyQuery.error || !companyQuery.data) {
    return (
      <ErrorState
        title="Company not available"
        description={companyQuery.error?.message ?? "This company could not be found."}
      />
    );
  }

  const company = companyQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="Company summary foundation wired to the backend company detail endpoint."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Company profile
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Legal name</dt>
              <dd className="font-medium">{company.legalName || "Not set"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="font-medium">{company.currency || "Not set"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Country</dt>
              <dd className="font-medium">{company.country || "Not set"}</dd>
            </div>
          </dl>
        </div>
        <div className="surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Next modules
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            This route is intentionally positioned as the company summary anchor before adding accounts,
            customers, vendors, invoices, bills, payments, and reports.
          </p>
        </div>
      </div>
    </div>
  );
}
