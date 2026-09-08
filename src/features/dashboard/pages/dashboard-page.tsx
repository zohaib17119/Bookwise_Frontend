import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  CreditCard,
  DollarSign,
  Landmark,
  Percent,
  Receipt,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { BalanceSparklineCard } from "@/components/dashboard/balance-sparkline-card";
import { CashFlowDonutChart } from "@/components/dashboard/cash-flow-donut-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { EntityCountStrip } from "@/components/dashboard/entity-count-strip";
import { FinancialOverviewChart } from "@/components/dashboard/financial-overview-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { usePatchAccount } from "@/features/accounts/hooks/use-accounts";
import { CashAccountsPanel } from "@/features/dashboard/components/cash-accounts-panel";
import { useCompanyDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import {
  getPeriodRangeFromPreset,
  type DashboardQueryParams,
} from "@/features/dashboard/types/dashboard.types";
import { useLowStockCount } from "@/features/inventory/hooks/use-inventory";
import { taxBalanceHint } from "@/features/shared/utils/wht-labels";
import { formatCurrency, formatNumber, formatPercent, formatShortDateRange } from "@/lib/utils/format";

export function DashboardPage() {
  const { companyId, company, currency, permissions } = useActiveCompany();
  const user = useAuthStore((state) => state.user);
  const [dateRange, setDateRange] = useState<DashboardQueryParams>(() => getPeriodRangeFromPreset(30));
  const [lowStockAlertDismissed, setLowStockAlertDismissed] = useState(false);
  const [shortageAlertDismissed, setShortageAlertDismissed] = useState(false);
  const [cashPanelOpen, setCashPanelOpen] = useState(false);
  const patchAccount = usePatchAccount(companyId);
  const canManageAccounts = canManageEntity(permissions, "accounts");

  const periodParams = dateRange;
  const periodLabel = useMemo(() => {
    if (!dateRange.fromDate || !dateRange.toDate) return "";
    return formatShortDateRange(dateRange.fromDate, dateRange.toDate);
  }, [dateRange.fromDate, dateRange.toDate]);
  const dashboardQuery = useCompanyDashboard(companyId, periodParams);
  const lowStockQuery = useLowStockCount(companyId);
  const profitMarginMiniChart = useMemo(
    () =>
      (dashboardQuery.data?.financialOverview ?? [])
        .slice(-5)
        .map((point) => point.netProfit),
    [dashboardQuery.data?.financialOverview],
  );

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
  const displayCurrency = getCompanyBaseCurrency(company, dashboard?.currencyCode ?? currency);
  const lowStockCount = lowStockQuery.data ?? 0;
  const showLowStockAlert = lowStockCount > 0 && !lowStockAlertDismissed;
  const shortageCount = dashboard?.inventoryShortages?.count ?? 0;
  const showShortageAlert = shortageCount > 0 && !shortageAlertDismissed;
  const isLoading = dashboardQuery.isLoading;

  return (
    <PageContainer className="space-y-6">
      <DashboardHeader
        companyName={company?.name ?? dashboard?.company?.name ?? "Company"}
        fromDate={dashboard?.period.fromDate ?? periodParams.fromDate ?? ""}
        onFromDateChange={(value) => setDateRange((prev) => ({ ...prev, fromDate: value }))}
        onToDateChange={(value) => setDateRange((prev) => ({ ...prev, toDate: value }))}
        previousFromDate={dashboard?.period.previousFromDate ?? ""}
        previousToDate={dashboard?.period.previousToDate ?? ""}
        toDate={dashboard?.period.toDate ?? periodParams.toDate ?? ""}
        userName={user?.fullName ?? user?.name}
      />

      {showShortageAlert ? (
        <div className="relative">
          <Alert
            description={`${formatNumber(shortageCount)} inventory shortage${shortageCount === 1 ? "" : "s"}: goods were sold after a purchase receive was voided and no remaining stock covered the sale. Add a purchase bill and receive stock to cover.`}
            title="Sold without inventory"
            variant="destructive"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button asChild size="sm" variant="primary">
              <Link to={`/app/company/${companyId}/bills/new`}>Buy stock / new bill</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to={`/app/company/${companyId}/inventory/stock-on-hand`}>View stock on hand</Link>
            </Button>
            <Button
              aria-label="Dismiss inventory shortage alert"
              className="ml-auto"
              onClick={() => setShortageAlertDismissed(true)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {showLowStockAlert ? (
        <div className="relative">
          <Alert
            description={`${formatNumber(lowStockCount)} item${lowStockCount === 1 ? "" : "s"} ${lowStockCount === 1 ? "is" : "are"} at or below reorder level.`}
            title="Low stock alert"
            variant="destructive"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button asChild size="sm" variant="primary">
              <Link to={`/app/company/${companyId}/bills/new?from=low-stock`}>Buy Stock</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to={`/app/company/${companyId}/inventory/stock-on-hand`}>View stock on hand</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/company/${companyId}/inventory/adjustments/new`}>Adjustment only</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to={`/app/company/${companyId}/items`}>View items</Link>
            </Button>
            <Button
              aria-label="Dismiss low stock alert"
              className="ml-auto"
              onClick={() => setLowStockAlertDismissed(true)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <QuickActions companyId={companyId} />

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardKpiCard
          badgeLabel="Sales"
          changePercent={metrics?.changePercent.totalRevenue ?? null}
          icon={DollarSign}
          isLoading={isLoading}
          title="Total Revenue"
          tone="green"
          value={formatCurrency(metrics?.totalRevenue ?? 0, displayCurrency)}
        />
        <DashboardKpiCard
          badgeLabel="Product cost"
          changePercent={metrics?.changePercent.totalCogs ?? null}
          icon={Receipt}
          isLoading={isLoading}
          title="Cost of Goods Sold"
          tone="red"
          value={formatCurrency(metrics?.totalCogs ?? 0, displayCurrency)}
        />
        <DashboardKpiCard
          badgeLabel={`Gross margin ${formatPercent(metrics?.grossMargin ?? 0)}%`}
          changePercent={metrics?.changePercent.grossProfit ?? null}
          icon={ArrowUpDown}
          isLoading={isLoading}
          title="Gross Profit"
          tone="blue"
          value={formatCurrency(metrics?.grossProfit ?? 0, displayCurrency)}
        />
        <DashboardKpiCard
          badgeLabel="Operating"
          changePercent={metrics?.changePercent.totalExpenses ?? null}
          icon={CreditCard}
          isLoading={isLoading}
          title="Total Expenses"
          tone="red"
          value={formatCurrency(metrics?.totalExpenses ?? 0, displayCurrency)}
        />
        <DashboardKpiCard
          badgeLabel={(metrics?.netProfit ?? 0) >= 0 ? "After costs" : "Loss"}
          changePercent={metrics?.changePercent.netProfit ?? null}
          icon={Wallet}
          isLoading={isLoading}
          title="Net Profit"
          tone="blue"
          value={formatCurrency(metrics?.netProfit ?? 0, displayCurrency)}
        />
        <DashboardKpiCard
          badgeLabel="Net margin"
          changePercent={metrics?.changePercent.profitMargin ?? null}
          footer={`vs ${formatPercent(metrics?.previous.profitMargin ?? 0)}% last period`}
          icon={Percent}
          isLoading={isLoading}
          miniChartData={profitMarginMiniChart}
          title="Net Margin"
          tone="blue"
          value={`${formatPercent(metrics?.profitMargin ?? 0)}%`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FinancialOverviewChart
          currency={displayCurrency}
          data={dashboard?.financialOverview ?? []}
          isLoading={isLoading}
          periodLabel={periodLabel}
        />
        <CashFlowDonutChart
          currency={displayCurrency}
          data={
            dashboard?.cashFlowOverview ?? {
              cashBalance: 0,
              accountsReceivable: 0,
              accountsPayable: 0,
              netCashFlow: 0,
            }
          }
          isLoading={isLoading}
          periodLabel={periodLabel}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <BalanceSparklineCard
          data={dashboard?.sparklines.cashBalance ?? []}
          icon={Wallet}
          isLoading={isLoading}
          onClick={() => setCashPanelOpen((open) => !open)}
          subtitle="Click to include or exclude cash and bank accounts"
          title="Cash Balance"
          tone="green"
          value={formatCurrency(metrics?.cashBalance ?? 0, displayCurrency)}
        />
        <BalanceSparklineCard
          data={dashboard?.sparklines.accountsReceivable ?? []}
          icon={Users}
          isLoading={isLoading}
          subtitle="Outstanding from customers"
          title="Accounts Receivable"
          tone="blue"
          value={formatCurrency(metrics?.accountsReceivable ?? 0, displayCurrency)}
        />
        <BalanceSparklineCard
          data={dashboard?.sparklines.accountsPayable ?? []}
          icon={CreditCard}
          isLoading={isLoading}
          subtitle="Outstanding to vendors"
          title="Accounts Payable"
          tone="red"
          value={formatCurrency(metrics?.accountsPayable ?? 0, displayCurrency)}
        />
      </div>

      {cashPanelOpen ? (
        <CashAccountsPanel
          accounts={dashboard?.cashAccounts ?? []}
          canManage={canManageAccounts}
          currency={displayCurrency}
          isPending={patchAccount.isPending}
          onClose={() => setCashPanelOpen(false)}
          onIncludeAll={() => {
            void Promise.all(
              (dashboard?.cashAccounts ?? [])
                .filter((account) => !account.included)
                .map((account) =>
                  patchAccount.mutateAsync({
                    accountId: account.id,
                    payload: { includeInDashboardCash: true },
                  }),
                ),
            );
          }}
          onToggle={(accountId, included) => {
            patchAccount.mutate({
              accountId,
              payload: { includeInDashboardCash: included },
            });
          }}
        />
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Tax balances</h2>
          <Button asChild size="sm" variant="secondary">
            <Link to={`/app/company/${companyId}/tax/payments`}>Pay / collect tax</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardKpiCard
            badgeLabel="To pay"
            changePercent={null}
            footer="GL balance"
            hint={taxBalanceHint("payable", "vat")}
            icon={Landmark}
            isLoading={isLoading}
            title="Sales tax / VAT payable"
            tone="red"
            value={formatCurrency(metrics?.taxBalances?.salesTaxPayable ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="To collect"
            changePercent={null}
            footer="GL balance"
            hint={taxBalanceHint("receivable", "vat")}
            icon={Landmark}
            isLoading={isLoading}
            title="Sales tax / VAT receivable"
            tone="green"
            value={formatCurrency(metrics?.taxBalances?.salesTaxReceivable ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="Credit"
            changePercent={null}
            footer="GL balance"
            hint="FBR / authority sales tax credit held as carry forward after collecting VAT receivable. Use it when paying sales tax payable."
            icon={Landmark}
            isLoading={isLoading}
            title="Sales tax carry forward"
            tone="blue"
            value={formatCurrency(metrics?.taxBalances?.salesTaxCarryForward ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="To pay"
            changePercent={null}
            footer="GL balance"
            hint={taxBalanceHint("payable", "salesTaxWht")}
            icon={Landmark}
            isLoading={isLoading}
            title="Sales tax WHT payable"
            tone="red"
            value={formatCurrency(metrics?.taxBalances?.salesTaxWhtPayable ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="To collect"
            changePercent={null}
            footer="GL balance"
            hint={taxBalanceHint("receivable", "salesTaxWht")}
            icon={Landmark}
            isLoading={isLoading}
            title="Sales tax WHT receivable"
            tone="green"
            value={formatCurrency(metrics?.taxBalances?.salesTaxWhtReceivable ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="To pay"
            changePercent={null}
            footer="GL balance"
            hint={taxBalanceHint("payable", "incomeWht")}
            icon={Landmark}
            isLoading={isLoading}
            title="Income WHT payable"
            tone="red"
            value={formatCurrency(metrics?.taxBalances?.incomeWhtPayable ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="To collect"
            changePercent={null}
            footer="GL balance"
            hint={taxBalanceHint("receivable", "incomeWht")}
            icon={Landmark}
            isLoading={isLoading}
            title="Income WHT receivable"
            tone="green"
            value={formatCurrency(metrics?.taxBalances?.incomeWhtReceivable ?? 0, displayCurrency)}
          />
          <DashboardKpiCard
            badgeLabel="Claimed"
            changePercent={null}
            footer="GL balance"
            hint="Customer-held income WHT moved from receivable when claimed from the authority."
            icon={Landmark}
            isLoading={isLoading}
            title="Income WHT claimed"
            tone="blue"
            value={formatCurrency(metrics?.taxBalances?.incomeWhtClaimed ?? 0, displayCurrency)}
          />
        </div>
      </div>

      <EntityCountStrip counts={counts ?? {
        totalCustomers: 0,
        totalVendors: 0,
        totalInvoices: 0,
        totalBills: 0,
      }} isLoading={isLoading} />
    </PageContainer>
  );
}
