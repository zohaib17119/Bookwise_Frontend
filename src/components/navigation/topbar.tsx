import { Menu, PanelLeft, PanelLeftClose, Search, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { CompanySwitcher } from "@/components/navigation/company-switcher";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/auth/types/auth.types";
import { useLocale, type AppLocale } from "@/features/i18n";

interface TopbarProps {
  user: User | null;
  companyId?: string;
  companyName?: string;
  onMenuClick?: () => void;
  onLogout: () => void;
  sidebarCollapsed?: boolean;
  onSidebarCollapse?: () => void;
}

function LanguageSelect({
  locale,
  onChange,
  className
}: {
  locale: AppLocale;
  onChange: (locale: AppLocale) => void;
  className?: string;
}) {
  return (
    <select
      aria-label="Language"
      className={
        className ??
        "h-10 rounded-xl border border-border/70 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
      }
      value={locale}
      onChange={(e) => onChange(e.target.value as AppLocale)}
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}

export function Topbar({
  user,
  companyId,
  companyName,
  onMenuClick,
  onLogout,
  sidebarCollapsed,
  onSidebarCollapse,
}: TopbarProps) {
  const { locale, setLocale } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="page-shell flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onMenuClick ? (
              <Button
                aria-label="Open navigation"
                onClick={onMenuClick}
                size="icon"
                variant="ghost"
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            ) : null}
            {onSidebarCollapse ? (
              <Button
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden lg:inline-flex"
                onClick={onSidebarCollapse}
                size="icon"
                variant="ghost"
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {companyName ?? "Bookwise workspace"}
              </p>
              <Breadcrumbs companyId={companyId} companyName={companyName} />
            </div>
          </div>

          <div className="hidden flex-1 justify-center lg:flex">
            <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-xl border border-border/70 bg-white px-4 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground">
                Search invoices, customers, vendors
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSelect locale={locale} onChange={setLocale} />
            <CompanySwitcher companyId={companyId} />
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-white px-3 py-2 shadow-sm">
              <UserCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 text-end">
                <p className="truncate text-sm font-medium">{user?.name ?? "Account"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="ghost">
              Logout
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <CompanySwitcher companyId={companyId} />
            <LanguageSelect locale={locale} onChange={setLocale} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-3 py-2 shadow-sm">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name ?? "Account"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button onClick={onLogout} variant="ghost" size="sm">
              Logout
            </Button>
          </div>
          <Link
            className="flex h-11 items-center gap-3 rounded-xl border border-border/70 bg-white px-4 text-sm text-muted-foreground shadow-sm"
            to={companyId ? `/app/company/${companyId}/dashboard` : "/app/companies"}
          >
            <Search className="h-4 w-4 shrink-0" />
            Search placeholder
          </Link>
        </div>
      </div>
    </header>
  );
}
