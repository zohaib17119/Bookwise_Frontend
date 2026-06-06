import { Building2, ChevronsUpDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { useCompanyStore } from "@/features/companies/store/company.store";
import { cn } from "@/lib/utils/cn";

interface CompanySwitcherProps {
  companyId?: string;
  className?: string;
}

function buildDestinationPath(pathname: string, nextCompanyId: string) {
  const match = pathname.match(/^\/app\/company\/([^/]+)(\/.*)?$/);

  if (!match) {
    return `/app/company/${nextCompanyId}/dashboard`;
  }

  const suffix = match[2] ?? "/dashboard";
  return `/app/company/${nextCompanyId}${suffix}`;
}

export function CompanySwitcher({
  companyId,
  className,
}: CompanySwitcherProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: companies = [] } = useCompanies();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);
  const resolvedCompanyId = companyId ?? activeCompanyId ?? "";
console.log("companies",companies)

  return (
    <label
      className={cn(
        "flex h-11 items-center gap-3 rounded-xl border border-border/70 bg-white px-3 text-sm shadow-sm",
        className,
      )}
    >
      <Building2 className="h-4 w-4 text-primary" />
      <select
        className="min-w-[180px] bg-transparent outline-none"
        value={resolvedCompanyId}
        onChange={(event) => {
          const nextCompanyId = event.target.value;
          setActiveCompanyId(nextCompanyId);
          navigate(`${buildDestinationPath(location.pathname, nextCompanyId)}${location.search}`);
        }}
      >
        <option value="" disabled>
          Select company
        </option>
        {companies?.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    </label>
  );
}
