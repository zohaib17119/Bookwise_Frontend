import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { useCompanyStore } from "@/features/companies/store/company.store";

export function CompanySwitcher() {
  const navigate = useNavigate();
  const { data: companies = [] } = useCompanies();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);

  return (
    <label className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2">
      <Building2 className="h-4 w-4 text-primary" />
      <select
        className="min-w-[180px] bg-transparent text-sm outline-none"
        value={activeCompanyId ?? ""}
        onChange={(event) => {
          const companyId = event.target.value;
          setActiveCompanyId(companyId);
          navigate(`/app/company/${companyId}/dashboard`);
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
    </label>
  );
}
