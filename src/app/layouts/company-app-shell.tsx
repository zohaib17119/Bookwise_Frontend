import { Building2, X } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { Topbar } from "@/components/navigation/topbar";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCompanyStore } from "@/features/companies/store/company.store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function CompanyAppShell() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);
  const sidebarOpen = useCompanyStore((state) => state.sidebarOpen);
  const setSidebarOpen = useCompanyStore((state) => state.setSidebarOpen);
  const { companyId, company, currency, permissions } = useActiveCompany();
  

  if (!companyId) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(241,245,249,0.95))] lg:grid lg:grid-cols-[300px_1fr]">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[300px] -translate-x-full border-r border-white/10 bg-slate-950 px-6 py-7 text-slate-100 transition lg:static lg:translate-x-0",
          sidebarOpen && "translate-x-0",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <Link className="inline-flex items-center gap-3" to="/app/companies">
            <div className="rounded-2xl bg-cyan-400/15 p-2 text-cyan-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Bookwise
              </p>
              <p className="text-lg font-semibold">{company?.name ?? "Accounting OS"}</p>
            </div>
          </Link>

          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active company</p>
          <p className="mt-2 text-base font-semibold">{company?.name}</p>
          <p className="mt-1 text-sm text-slate-400">
            {currency} reporting base
          </p>
          <Link className="font-medium text-primary" to="/app/companies">
            <span onClick={()=>setActiveCompanyId(null)}>
              All Companies
              </span>
          </Link>
        </div>

        <div className="mt-8 overflow-y-auto pb-8">
          <SidebarNav companyId={companyId} permissions={permissions} />
        </div>
      </aside>

      <div className="min-w-0">
        <Topbar
          companyId={companyId}
          companyName={company?.name}
          onLogout={() => {
            setActiveCompanyId(null);
            clearAuth();
          }}
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />
        <main className="page-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
