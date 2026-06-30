import { Clock3, FileText, Landmark, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import {
  useCompanyDashboard,
  useDashboardAnalytics,
} from "@/features/dashboard/hooks/use-dashboard";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

export function DashboardPage() {
  const { companyId, company, currency } = useActiveCompany();
  const dashboardQuery = useCompanyDashboard(companyId);
  const analytics = useDashboardAnalytics(companyId);

  if (!companyId) {
    return null;
  }

  if (dashboardQuery.error) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        description={dashboardQuery.error.message}
        action={
          <Button asChild variant="secondary">
            <Link to={`/app/company/${companyId}`}>Open company summary</Link>
          </Button>
        }
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const metrics = dashboard?.metrics;
  const counts = dashboard?.counts;
  const activity = dashboard?.recentActivity ?? [];
  const displayCurrency = getCompanyBaseCurrency(company, dashboard?.currency ?? currency);

  return (
    <PageContainer
      header={
        <PageHeader
          title={`${company?.name ?? "Company"} dashboard`}
          description="Monitor core accounting KPIs, activity, and trends inside the active company context."
          eyebrow="Financial overview"
          actions={
            <Button asChild variant="secondary">
              <Link to={`/app/company/${companyId}`}>View company summary</Link>
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          description="Recognized across the active reporting period"
          isLoading={dashboardQuery.isLoading}
          title="Total revenue"
          trendDirection="up"
          trendLabel="Revenue in focus"
          value={formatCurrency(metrics?.totalRevenue ?? 0, displayCurrency)}
        />
        <MetricCard
          description="Tracked purchases and outgoing obligations"
          isLoading={dashboardQuery.isLoading}
          title="Total expenses"
          trendDirection="down"
          trendLabel="Expense visibility"
          value={formatCurrency(metrics?.totalExpenses ?? 0, displayCurrency)}
        />
        <MetricCard
          description="Profit after expenses in the current snapshot"
          isLoading={dashboardQuery.isLoading}
          title="Net profit"
          trendDirection={(metrics?.netProfit ?? 0) >= 0 ? "up" : "down"}
          trendLabel={(metrics?.netProfit ?? 0) >= 0 ? "Positive margin" : "Negative margin"}
          value={formatCurrency(metrics?.netProfit ?? 0, displayCurrency)}
        />
        <MetricCard
          description="Available company cash position"
          isLoading={dashboardQuery.isLoading}
          title="Cash balance"
          value={formatCurrency(metrics?.cashBalance ?? 0, displayCurrency)}
        />
        <MetricCard
          description="Outstanding customer balances"
          isLoading={dashboardQuery.isLoading}
          title="Accounts receivable"
          value={formatCurrency(metrics?.accountsReceivable ?? 0, displayCurrency)}
        />
        <MetricCard
          description="Outstanding vendor obligations"
          isLoading={dashboardQuery.isLoading}
          title="Accounts payable"
          value={formatCurrency(metrics?.accountsPayable ?? 0, displayCurrency)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          {
            icon: Users,
            label: "Customers",
            value: formatNumber(counts?.totalCustomers ?? 0),
          },
          {
            icon: Landmark,
            label: "Vendors",
            value: formatNumber(counts?.totalVendors ?? 0),
          },
          {
            icon: FileText,
            label: "Invoices",
            value: formatNumber(counts?.totalInvoices ?? 0),
          },
          {
            icon: Clock3,
            label: "Bills",
            value: formatNumber(counts?.totalBills ?? 0),
          },
        ].map((item) => (
          <div className="surface flex items-center gap-4 p-5" key={item.label}>
            {dashboardQuery.isLoading ? (
              <div className="h-16 w-full animate-pulse rounded-2xl bg-slate-200/70" />
            ) : (
              <>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            color="#0f766e"
          currency={displayCurrency}
          data={analytics.revenue.data ?? []}
          description="Company-scoped revenue analytics from the backend trend endpoint."
          errorMessage={analytics.revenue.error?.message}
          isLoading={analytics.revenue.isLoading}
          title="Revenue trend"
        />
        </div>
        <QuickActions companyId={companyId} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          color="#ea580c"
          currency={displayCurrency}
          data={analytics.expenses.data ?? []}
          description="Expense movement across the current reporting window."
          errorMessage={analytics.expenses.error?.message}
          isLoading={analytics.expenses.isLoading}
          title="Expense trend"
        />
        <ChartCard
          color="#2563eb"
          currency={displayCurrency}
          data={analytics.cashflow.data ?? []}
          description="Cash flow direction for treasury visibility and planning."
          errorMessage={analytics.cashflow.error?.message}
          isLoading={analytics.cashflow.isLoading}
          title="Cash flow trend"
        />
      </div>

      <SectionCard
        title="Recent activity"
        description="Recent accounting and operational events in this company workspace."
      >
        {activity.length ? (
          <div className="space-y-4">
            {activity.map((item) => (
              <div
                className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-white p-4"
                key={item.id}
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{item.occurredAt}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent activity yet"
            description="This section is ready for audit logs, transaction history, and timeline events once the backend exposes them."
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
