export interface DashboardMetricSet {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
}

export interface DashboardSummarySet {
  totalCustomers: number;
  totalVendors: number;
  totalInvoices: number;
  totalBills: number;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  type?: string;
}

export interface DashboardOverview {
  currency?: string;
  metrics: DashboardMetricSet;
  counts: DashboardSummarySet;
  recentActivity: DashboardActivityItem[];
}

export interface AnalyticsPoint {
  date: string;
  value: number;
}
