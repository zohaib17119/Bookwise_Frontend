import { apiClient } from "@/lib/api/client";
import type {
  DashboardOverview,
  DashboardQueryParams,
} from "@/features/dashboard/types/dashboard.types";
import { parseMoney } from "@/lib/utils/money";

/** Chart/KPI edge only — BE already serializes money as 2dp strings. */
function parseNumber(value: unknown): number {
  return parseMoney(value);
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDashboardResponse(raw: Record<string, unknown>): DashboardOverview {
  const metrics = (raw.metrics ?? {}) as Record<string, unknown>;
  const previous = (metrics.previous ?? {}) as Record<string, unknown>;
  const changePercent = (metrics.changePercent ?? {}) as Record<string, unknown>;
  const taxBalances = (metrics.taxBalances ?? {}) as Record<string, unknown>;
  const period = (raw.period ?? {}) as Record<string, unknown>;
  const cashFlowOverview = (raw.cashFlowOverview ?? {}) as Record<string, unknown>;
  const sparklines = (raw.sparklines ?? {}) as Record<string, unknown>;
  const counts = (raw.counts ?? {}) as Record<string, unknown>;
  const company = raw.company as DashboardOverview["company"];

  const financialOverview = Array.isArray(raw.financialOverview)
    ? raw.financialOverview.map((point) => {
        const row = point as Record<string, unknown>;
        return {
          date: String(row.date ?? ""),
          revenue: parseNumber(row.revenue),
          expenses: parseNumber(row.expenses),
          netProfit: parseNumber(row.netProfit),
        };
      })
    : [];

  const parseSparkline = (value: unknown) =>
    Array.isArray(value)
      ? value.map((point) => {
          const row = point as Record<string, unknown>;
          return {
            date: String(row.date ?? ""),
            value: parseNumber(row.value),
          };
        })
      : [];

  return {
    currencyCode: String(raw.currencyCode ?? company?.baseCurrencyCode ?? "USD"),
    company,
    period: {
      fromDate: String(period.fromDate ?? ""),
      toDate: String(period.toDate ?? ""),
      previousFromDate: String(period.previousFromDate ?? ""),
      previousToDate: String(period.previousToDate ?? ""),
    },
    metrics: {
      totalRevenue: parseNumber(metrics.totalRevenue),
      totalCogs: parseNumber(metrics.totalCogs),
      grossProfit: parseNumber(metrics.grossProfit),
      grossMargin: parseNumber(metrics.grossMargin),
      totalExpenses: parseNumber(metrics.totalExpenses),
      netProfit: parseNumber(metrics.netProfit),
      profitMargin: parseNumber(metrics.profitMargin),
      cashBalance: parseNumber(metrics.cashBalance),
      accountsReceivable: parseNumber(metrics.accountsReceivable),
      accountsPayable: parseNumber(metrics.accountsPayable),
      taxBalances: {
        salesTaxPayable: parseNumber(taxBalances.salesTaxPayable),
        salesTaxReceivable: parseNumber(taxBalances.salesTaxReceivable),
        salesTaxCarryForward: parseNumber(taxBalances.salesTaxCarryForward),
        salesTaxWhtPayable: parseNumber(taxBalances.salesTaxWhtPayable),
        salesTaxWhtReceivable: parseNumber(taxBalances.salesTaxWhtReceivable),
        incomeWhtPayable: parseNumber(taxBalances.incomeWhtPayable),
        incomeWhtReceivable: parseNumber(taxBalances.incomeWhtReceivable),
        incomeWhtClaimed: parseNumber(taxBalances.incomeWhtClaimed),
      },
      previous: {
        totalRevenue: parseNumber(previous.totalRevenue),
        totalCogs: parseNumber(previous.totalCogs),
        grossProfit: parseNumber(previous.grossProfit),
        grossMargin: parseNumber(previous.grossMargin),
        totalExpenses: parseNumber(previous.totalExpenses),
        netProfit: parseNumber(previous.netProfit),
        profitMargin: parseNumber(previous.profitMargin),
      },
      changePercent: {
        totalRevenue: parseNullableNumber(changePercent.totalRevenue),
        totalCogs: parseNullableNumber(changePercent.totalCogs),
        grossProfit: parseNullableNumber(changePercent.grossProfit),
        grossMargin: parseNullableNumber(changePercent.grossMargin),
        totalExpenses: parseNullableNumber(changePercent.totalExpenses),
        netProfit: parseNullableNumber(changePercent.netProfit),
        profitMargin: parseNullableNumber(changePercent.profitMargin),
      },
    },
    financialOverview,
    cashFlowOverview: {
      cashBalance: parseNumber(cashFlowOverview.cashBalance),
      accountsReceivable: parseNumber(cashFlowOverview.accountsReceivable),
      accountsPayable: parseNumber(cashFlowOverview.accountsPayable),
      netCashFlow: parseNumber(cashFlowOverview.netCashFlow),
    },
    sparklines: {
      cashBalance: parseSparkline(sparklines.cashBalance),
      accountsReceivable: parseSparkline(sparklines.accountsReceivable),
      accountsPayable: parseSparkline(sparklines.accountsPayable),
    },
    counts: {
      totalCustomers: parseCount(counts.totalCustomers),
      totalVendors: parseCount(counts.totalVendors),
      totalInvoices: parseCount(counts.totalInvoices),
      totalBills: parseCount(counts.totalBills),
    },
  };
}

function buildQuery(params: DashboardQueryParams = {}) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getCompanyDashboard(
  companyId: string,
  params: DashboardQueryParams = {},
) {
  const { data } = await apiClient.get<Record<string, unknown>>(
    `/companies/${companyId}/dashboard${buildQuery(params)}`,
  );
  return parseDashboardResponse(data);
}
