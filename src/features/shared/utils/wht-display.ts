/** Shared WHT display helpers for lists and allocation tables. */

export function formatWhtRateLabel(rate?: string | number | null): string {
  if (rate == null || rate === "") return "";
  const n = Number(rate);
  if (!Number.isFinite(n)) return String(rate);
  return `${n}%`;
}

export function formatWhtTypeShort(type?: string | null): string {
  if (type === "INCOME") return "Income";
  if (type === "SALES_TAX") return "Sales tax";
  return "";
}

export function formatWhtCell(input: {
  enabled?: boolean | null;
  rate?: string | number | null;
  amount?: string | number | null;
  type?: string | null;
  formatAmount: (value: string | number) => string;
}): string {
  if (!input.enabled) return "—";
  const rate = formatWhtRateLabel(input.rate);
  const type = formatWhtTypeShort(input.type);
  const amount = input.formatAmount(input.amount ?? 0);
  const prefix = rate ? `WHT @${rate}` : "WHT";
  return type ? `${prefix} (${type}) ${amount}` : `${prefix} ${amount}`;
}

export function documentReceivableOrPayable(input: {
  enabled?: boolean | null;
  total?: string | number | null;
  netSettlementAmount?: string | number | null;
}): string {
  if (input.enabled && input.netSettlementAmount != null && input.netSettlementAmount !== "") {
    return String(input.netSettlementAmount);
  }
  return String(input.total ?? "0");
}
