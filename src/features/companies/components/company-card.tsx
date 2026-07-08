import { Building2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Company } from "@/features/companies/types/company.types";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      className="surface group flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
      to={`/app/company/${company.id}/dashboard`}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{company.name}</h3>
            {company.accessType === "MEMBER" ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {company.role ?? "Team member"}
              </span>
            ) : null}
            {company.membershipStatus === "INVITED" ? (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Pending
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {company.legalName || company.slug || (company.accessType === "MEMBER" ? "Shared workspace" : "Accounting workspace")}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}
