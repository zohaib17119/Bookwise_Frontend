import { X } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { AppShellMain, getSidebarOffset } from "@/components/navigation/app-shell-utils";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { Topbar } from "@/components/navigation/topbar";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCompanyStore } from "@/features/companies/store/company.store";
import { useIsLg } from "@/lib/hooks/use-is-lg";
import { cn } from "@/lib/utils/cn";
import logo from "@/assets/horizontal_logo.png";
import smallLogo from "@/assets/app-logo.png";

export function CompanyAppShell() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);
  const sidebarOpen = useCompanyStore((state) => state.sidebarOpen);
  const setSidebarOpen = useCompanyStore((state) => state.setSidebarOpen);
  const sidebarCollapsed = useCompanyStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useCompanyStore((state) => state.setSidebarCollapsed);
  const toggleSidebarCollapsed = useCompanyStore((state) => state.toggleSidebarCollapsed);
  const { companyId, company, currency, permissions } = useActiveCompany();
  const isLg = useIsLg();
  const navCollapsed = isLg && sidebarCollapsed;
  const isMobileDrawerOpen = !isLg && sidebarOpen;
  const showBackdrop = isMobileDrawerOpen || (isLg && !sidebarCollapsed);
  const sidebarOffset = getSidebarOffset(isLg);
  const companyInitial = company?.name?.trim().charAt(0).toUpperCase() ?? "B";

  if (!companyId) {
    return <Outlet />;
  }

  const collapseSidebar = () => {
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition",
          showBackdrop ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={collapseSidebar}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-svh flex-col border-r border-white/10 bg-sidebar text-slate-100 transition-[width,transform] duration-200",
          isLg ? (navCollapsed ? "w-[72px] translate-x-0" : "w-[280px] translate-x-0") : "w-[280px]",
          !isLg && (sidebarOpen ? "translate-x-0" : "-translate-x-full"),
        )}
      >
        <div
          className={cn(
            "flex shrink-0 border-b border-white/10 py-4",
            navCollapsed
              ? "flex-col items-center gap-2 px-2"
              : "flex-row items-center justify-between px-4",
          )}
        >
          <Link
            className={cn(
              "inline-flex min-w-0 items-center",
              navCollapsed ? "justify-center" : "gap-3",
            )}
            to="/app/companies"
            onClick={collapseSidebar}
          >
            {navCollapsed ? (
              <img alt="Bookwise" className="h-10 w-10 rounded-xl object-cover" src={smallLogo} />
            ) : (
              <img alt="Bookwise" className="h-12" src={logo} />
            )}
          </Link>
          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={collapseSidebar}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-3">
          {navCollapsed ? (
            <div className="mb-4 flex justify-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-cyan-200"
                title={company?.name ?? "Active company"}
              >
                {companyInitial}
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-base font-semibold">{company?.name}</p>
              <p className="mt-1 text-sm text-slate-400">{currency} reporting base</p>
              <Link className="mt-2 inline-block text-xs font-medium text-primary" to="/app/companies">
                <span
                  onClick={() => {
                    setActiveCompanyId(null);
                    collapseSidebar();
                  }}
                >
                  All Companies
                </span>
              </Link>
            </div>
          )}

          <SidebarNav
            collapsed={navCollapsed}
            companyId={companyId}
            onNavigate={collapseSidebar}
            permissions={permissions}
          />
        </div>
      </aside>

      <AppShellMain
        className="bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(241,245,249,0.95))]"
        sidebarOffset={sidebarOffset}
      >
        <Topbar
          companyId={companyId}
          companyName={company?.name}
          onLogout={() => logoutMutation.mutate()}
          onMenuClick={() => setSidebarOpen(true)}
          onSidebarCollapse={toggleSidebarCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          user={user}
        />
        <main className="page-shell">
          <Outlet />
        </main>
      </AppShellMain>
    </>
  );
}
