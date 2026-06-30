import { formatCurrency } from "@/lib/utils/format";

interface AmountSummaryCardProps {
  currencyCode?: string | null;
  fallbackCurrency?: string;
  amount?: number | null;
  label: string;
}

export function AmountSummaryCard({
  currencyCode,
  fallbackCurrency,
  amount,
  label,
}: AmountSummaryCardProps) {
  const currency = currencyCode ?? fallbackCurrency ?? "USD";

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold">
        {formatCurrency(amount ?? 0, currency)}
      </p>
    </div>
  );
}
