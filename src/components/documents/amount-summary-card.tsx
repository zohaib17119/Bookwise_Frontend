import { formatCurrency } from "@/lib/utils/format";

interface AmountSummaryCardProps {
  currencyCode?: string | null;
  amount?: number | null;
  label: string;
}

export function AmountSummaryCard({
  currencyCode,
  amount,
  label,
}: AmountSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold">
        {formatCurrency(amount ?? 0, currencyCode ?? "USD")}
      </p>
    </div>
  );
}
