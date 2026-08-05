import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  FileInput,
  FilePlus2,
  PackagePlus,
  Receipt,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils/cn";

interface QuickActionsProps {
  companyId: string;
}

type ActionTone = "emerald" | "sky" | "amber" | "rose" | "violet" | "teal";

interface QuickLink {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  tone: ActionTone;
}

const toneStyles: Record<ActionTone, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-600",
};

const quickLinks: QuickLink[] = [
  {
    title: "Create invoice",
    description: "Bill a customer for sales",
    to: "invoices/new",
    icon: FilePlus2,
    tone: "emerald",
  },
  {
    title: "Create bill / Purchase invoice",
    description: "Record a vendor purchase invoice",
    to: "bills/new",
    icon: FileInput,
    tone: "sky",
  },
  {
    title: "Buy stock",
    description: "Purchase inventory from a vendor",
    to: "bills/new?from=buy-stock",
    icon: PackagePlus,
    tone: "amber",
  },
  {
    title: "Create expense",
    description: "Log an operating expense",
    to: "expenses/new",
    icon: Receipt,
    tone: "rose",
  },
  {
    title: "Receive payment",
    description: "Record a customer payment",
    to: "customer-payments/new",
    icon: Banknote,
    tone: "teal",
  },
  {
    title: "Pay bill",
    description: "Pay an outstanding vendor bill",
    to: "bill-payments/new",
    icon: Wallet,
    tone: "violet",
  },
];

export function QuickActions({ companyId }: QuickActionsProps) {
  return (
    <SectionCard
      description="Jump straight into the documents you create most."
      title="Quick actions"
    >
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {quickLinks.map((item) => (
          <Link
            className="group flex flex-col rounded-xl border border-border/70 bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm"
            key={item.title}
            to={`/app/company/${companyId}/${item.to}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={cn("rounded-xl p-2.5", toneStyles[item.tone])}>
                <item.icon aria-hidden className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground">
              {item.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
