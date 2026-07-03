import type { LucideIcon } from "lucide-react";
import { Clock3, FileText, Landmark, Users } from "lucide-react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import type { DashboardSummarySet } from "@/features/dashboard/types/dashboard.types";
import { formatNumber } from "@/lib/utils/format";

interface EntityCountStripProps {
  counts: DashboardSummarySet;
  isLoading?: boolean;
}

const items: Array<{
  key: keyof DashboardSummarySet;
  label: string;
  sublabel: string;
  icon: LucideIcon;
}> = [
  { key: "totalCustomers", label: "Customers", sublabel: "Total customers", icon: Users },
  { key: "totalVendors", label: "Vendors", sublabel: "Total vendors", icon: Landmark },
  { key: "totalInvoices", label: "Invoices", sublabel: "Total invoices", icon: FileText },
  { key: "totalBills", label: "Bills", sublabel: "Total bills", icon: Clock3 },
];

export function EntityCountStrip({ counts, isLoading }: EntityCountStripProps) {
  return (
    <div className="surface grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div className="flex items-center gap-3 border-border/70 xl:border-r xl:last:border-r-0 xl:pr-3 xl:last:pr-0" key={item.key}>
          {isLoading ? (
            <LoadingSkeleton className="h-14 w-full" />
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{formatNumber(counts[item.key])}</p>
                <p className="text-xs text-muted-foreground">{item.sublabel}</p>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
