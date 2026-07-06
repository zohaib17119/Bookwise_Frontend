import { Building2, CreditCard } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";
import { AppShellMain, getSidebarOffset } from "@/components/navigation/app-shell-utils";
import { SidebarNavItem } from "@/components/navigation/sidebar-nav-item";
import { Topbar } from "@/components/navigation/topbar";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCompanyStore } from "@/features/companies/store/company.store";
import { useIsLg } from "@/lib/hooks/use-is-lg";
import { cn } from "@/lib/utils/cn";
import logo from "@/assets/horizontal_logo.png";
import smallLogo from "@/assets/app-logo.png";

const globalNavigation = [
  { label: "Companies", to: "/app/companies", icon: Building2 },
  { label: "Subscription", to: "/app/subscription", icon: CreditCard },
];

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const sidebarCollapsed = useCompanyStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useCompanyStore((state) => state.setSidebarCollapsed);
  const toggleSidebarCollapsed = useCompanyStore((state) => state.toggleSidebarCollapsed);
  const { companyId } = useParams();
  const isLg = useIsLg();
  const navCollapsed = isLg && sidebarCollapsed;
  const sidebarOffset = getSidebarOffset(isLg);

  if (companyId) return <Outlet />;

  const collapseSidebar = () => setSidebarCollapsed(true);

  return (
    <>
      {isLg && !sidebarCollapsed ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition"
          onClick={collapseSidebar}
        />
      ) : null}

      <aside
        className={cn(
          "flex flex-col border-white/10 bg-sidebar text-slate-100",
          "w-full border-b",
          "lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:h-svh lg:translate-x-0 lg:border-b-0 lg:border-r lg:transition-[width] lg:duration-200",
          isLg && navCollapsed ? "lg:w-[72px]" : "lg:w-[280px]",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 border-b border-white/10 py-4",
            navCollapsed
              ? "flex-col items-center gap-2 px-2 lg:items-center"
              : "flex-row items-center justify-between px-4",
          )}
        >
          <Link
            className={cn("inline-flex min-w-0 items-center", navCollapsed ? "justify-center" : "gap-3")}
            to="/app/companies"
            onClick={collapseSidebar}
          >
            {navCollapsed ? (
              <img alt="Bookwise" className="h-10 w-10 rounded-xl object-cover lg:h-10 lg:w-10" src={smallLogo} />
            ) : (
              <img alt="Bookwise" className="h-12" src={logo} />
            )}
          </Link>
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-4 lg:max-h-[calc(100svh-4.5rem)] sm:px-3">
          <div className={navCollapsed ? "space-y-4" : "space-y-8"}>
            <nav className="space-y-2">
              {!navCollapsed ? (
                <p className="px-3 text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
              ) : null}
              {globalNavigation.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  collapsed={navCollapsed}
                  icon={item.icon}
                  label={item.label}
                  onNavigate={collapseSidebar}
                  to={item.to}
                  tone="global"
                />
              ))}
            </nav>

            {!navCollapsed ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Choose a company to enter the accounting workspace. Company-scoped modules live under
                `/app/company/:companyId/*`.
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <AppShellMain sidebarOffset={sidebarOffset}>
        <Topbar
          onLogout={() => logoutMutation.mutate()}
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
