import { NavLink } from "react-router-dom";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { cn } from "@/lib/utils/cn";

const links = [
  { segment: "invoices", label: "Invoices", end: true },
  { segment: "invoices/sales-persons", label: "Sales persons", end: false },
] as const;

export function InvoicesModuleNav() {
  const { companyId } = useActiveCompany();
  if (!companyId) return null;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border/70 pb-3">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-slate-900 text-white"
                : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
            )
          }
          end={link.end}
          key={link.segment}
          to={`/app/company/${companyId}/${link.segment}`}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
