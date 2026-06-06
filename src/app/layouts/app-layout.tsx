import { Building2, CreditCard } from "lucide-react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { Topbar } from "@/components/navigation/topbar";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCompanyStore } from "@/features/companies/store/company.store";
import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

const globalNavigation = [
  { label: "Companies", to: "/app/companies", icon: Building2 },
  { label: "Subscription", to: "/app/subscription", icon: CreditCard },
];

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
   const { companyId } = useParams();
  
  


  if(companyId) return (<Outlet /> )
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b bg-slate-950 px-6 py-8 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r">
        <Link className="inline-flex items-center gap-3" to="/app/companies">
          <div className="rounded-2xl bg-cyan-400/15 p-2 text-cyan-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Bookwise
            </p>
            <p className="text-lg font-semibold">Accounting OS</p>
          </div>
        </Link>

        <div className="mt-10 space-y-8">
          <nav className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
            {globalNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Choose a company to enter the accounting workspace. Company-scoped modules
            live under `/app/company/:companyId/*`.
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <Topbar
          onLogout={() => {
            setActiveCompanyId(null);
            clearAuth();
          }}
          user={user}
        />

        <main className="page-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
