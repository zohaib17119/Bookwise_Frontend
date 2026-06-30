import { formatCurrency } from "@/lib/utils/format";

interface DocumentTotalsCardProps {
  currencyCode?: string | null;
  fallbackCurrency?: string;
  subtotal?: number | null;
  discountTotal?: number | null;
  taxTotal?: number | null;
  total?: number | null;
  title?: string;
}

export function DocumentTotalsCard({
  currencyCode,
  fallbackCurrency,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  title = "Totals",
}: DocumentTotalsCardProps) {
  const currency = currencyCode ?? fallbackCurrency ?? "USD";

  return (
    <div className="ml-auto w-full max-w-sm rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right tabular-nums">{formatCurrency(subtotal ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Discount</dt>
          <dd className="text-right tabular-nums">{formatCurrency(discountTotal ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Tax</dt>
          <dd className="text-right tabular-nums">{formatCurrency(taxTotal ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 text-lg font-semibold">
          <dt>Total</dt>
          <dd className="text-right tabular-nums">{formatCurrency(total ?? 0, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
