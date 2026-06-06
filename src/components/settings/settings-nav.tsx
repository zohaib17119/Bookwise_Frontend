import { NavLink, useParams } from "react-router-dom";
import { cn } from "@/lib/utils/cn";

const settingsItems = [
  { segment: "company", label: "Company" },
  { segment: "accounting", label: "Accounting" },
  { segment: "tax", label: "Tax" },
  { segment: "team", label: "Team" },
  { segment: "preferences", label: "Preferences" },
];

export function SettingsNav() {
  const { companyId } = useParams();

  return (
    <nav className="surface h-fit p-3">
      <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Settings
      </p>
      <div className="space-y-1">
        {settingsItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                "block rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                isActive && "bg-secondary text-foreground",
              )
            }
            key={item.segment}
            to={`/app/company/${companyId}/settings/${item.segment}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
