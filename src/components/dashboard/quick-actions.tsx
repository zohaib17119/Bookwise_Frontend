import { ArrowRight, Building2, ReceiptText, Users, FileBarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  companyId: string;
}

interface QuickLink {
  title: string;
  description: string;
  to: string;
  icon: typeof Users;
  absolute?: boolean;
}

const quickLinks: QuickLink[] = [
  {
    title: "Customers",
    description: "Open the sales directory foundation",
    to: "customers",
    icon: Users,
  },
  {
    title: "Invoices",
    description: "Jump into invoice workflows",
    to: "invoices",
    icon: ReceiptText,
  },
  {
    title: "Reports",
    description: "Move into finance reporting",
    to: "reports",
    icon: FileBarChart2,
  },
  {
    title: "New company",
    description: "Create another company workspace",
    to: "/app/companies/new",
    icon: Building2,
    absolute: true,
  },
];

export function QuickActions({ companyId }: QuickActionsProps) {
  return (
    <SectionCard
      title="Quick actions"
      description="Fast paths to the modules finance teams use most."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            className="rounded-2xl border border-border/70 bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
            key={item.title}
            to={
              item.absolute ? item.to : `/app/company/${companyId}/${item.to}`
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button asChild variant="secondary">
          <Link to={`/app/company/${companyId}/settings`}>Open company settings</Link>
        </Button>
      </div>
    </SectionCard>
  );
}
