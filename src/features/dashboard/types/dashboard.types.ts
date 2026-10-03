export interface DashboardPeriod {
  fromDate: string;
  toDate: string;
  previousFromDate: string;
  previousToDate: string;
}

export interface DashboardMetricsSnapshot {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface DashboardMetrics extends DashboardMetricsSnapshot {
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  taxBalances?: {
    salesTaxPayable: number | string;
    salesTaxReceivable: number | string;
    salesTaxCarryForward?: number | string;
    salesTaxWhtPayable: number | string;
    salesTaxWhtReceivable: number | string;
    incomeWhtPayable: number | string;
    incomeWhtReceivable: number | string;
    incomeWhtClaimed?: number | string;
  };
  previous: DashboardMetricsSnapshot;
  changePercent: {
    totalRevenue: number | null;
    totalCogs: number | null;
    grossProfit: number | null;
    grossMargin: number | null;
    totalExpenses: number | null;
    netProfit: number | null;
    profitMargin: number | null;
  };
}

export interface DashboardFinancialOverviewPoint {
  date: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface DashboardSparklinePoint {
  date: string;
  value: number;
}

export interface DashboardCashFlowOverview {
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  netCashFlow: number;
}

export interface DashboardSummarySet {
  totalCustomers: number;
  totalVendors: number;
  totalInvoices: number;
  totalBills: number;
}

export interface DashboardCashAccount {
  id: string;
  code?: string | null;
  name: string;
  type: string;
  subtype?: string | null;
  included: boolean;
  balance: number;
}

export interface DashboardOverview {
  currencyCode: string;
  company?: {
    id: string;
    name: string;
    baseCurrencyCode?: string;
  };
  period: DashboardPeriod;
  metrics: DashboardMetrics;
  financialOverview: DashboardFinancialOverviewPoint[];
  cashFlowOverview: DashboardCashFlowOverview;
  sparklines: {
    cashBalance: DashboardSparklinePoint[];
    accountsReceivable: DashboardSparklinePoint[];
    accountsPayable: DashboardSparklinePoint[];
  };
  counts: DashboardSummarySet;
  cashAccounts?: DashboardCashAccount[];
  inventoryShortages?: {
    count: number;
    totalQuantity: string | number;
    items: Array<{
      id: string;
      itemId: string;
      itemName: string;
      itemCode?: string | null;
      quantity: string | number;
      unitCostAtSale: string | number;
      notes?: string | null;
      createdAt?: string;
    }>;
  };
}

export interface DashboardQueryParams {
  fromDate?: string;
  toDate?: string;
  salesPersonIds?: string[];
}

export type DashboardPeriodPreset = 7 | 30 | 90;

export function getPeriodRangeFromPreset(days: number): DashboardQueryParams {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - (days - 1));

  return {
    fromDate: fromDate.toISOString().slice(0, 10),
    toDate: toDate.toISOString().slice(0, 10),
  };
}
