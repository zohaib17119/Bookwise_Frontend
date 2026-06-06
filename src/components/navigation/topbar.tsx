import { Menu, Search, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { CompanySwitcher } from "@/components/navigation/company-switcher";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/auth/types/auth.types";

interface TopbarProps {
  user: User | null;
  companyId?: string;
  companyName?: string;
  onMenuClick?: () => void;
  onLogout: () => void;
}

export function Topbar({
  user,
  companyId,
  companyName,
  onMenuClick,
  onLogout,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="page-shell flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {companyName ?? "Bookwise workspace"}
              </p>
              <Breadcrumbs companyId={companyId} companyName={companyName} />
            </div>
          </div>

          <div className="hidden flex-1 justify-center lg:flex">
            <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-xl border border-border/70 bg-white px-4 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Search invoices, customers, vendors
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <CompanySwitcher companyId={companyId} />
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-white px-3 py-2 shadow-sm">
              <UserCircle2 className="h-5 w-5 text-muted-foreground" />
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name ?? "Account"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="ghost">
              Logout
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          <CompanySwitcher companyId={companyId} />
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-3 py-2 shadow-sm">
            <div>
              <p className="text-sm font-medium">{user?.name ?? "Account"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button onClick={onLogout} variant="ghost" size="sm">
              Logout
            </Button>
          </div>
          <Link
            className="flex h-11 items-center gap-3 rounded-xl border border-border/70 bg-white px-4 text-sm text-muted-foreground shadow-sm"
            to={companyId ? `/app/company/${companyId}/dashboard` : "/app/companies"}
          >
            <Search className="h-4 w-4" />
            Search placeholder
          </Link>
        </div>
      </div>
    </header>
  );
}
