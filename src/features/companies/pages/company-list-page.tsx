import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { CompanyCard } from "@/features/companies/components/company-card";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function CompanyListPage() {
  const companiesQuery = useCompanies();

  if (companiesQuery.isLoading) {
    return <LoadingState title="Loading your companies" description="Fetching company memberships and ownership data." />;
  }

  if (companiesQuery.error) {
    return <ErrorState title="Unable to load companies" description={companiesQuery.error.message} />;
  }

  const companies = companiesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Choose the accounting workspace you want to manage."
        actions={
          <Button asChild>
            <Link to="/app/companies/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New company
            </Link>
          </Button>
        }
      />

      {companies.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {companies?.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No companies yet"
          description="Create your first company to unlock dashboard, accounting modules, and company-scoped routes."
          action={
            <Button asChild>
              <Link to="/app/companies/new">Create company</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
