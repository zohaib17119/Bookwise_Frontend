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
          <h3 className="text-base font-semibold">{company.name}</h3>
          <p className="text-sm text-muted-foreground">
            {company.legalName || company.slug || "Accounting workspace"}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}
