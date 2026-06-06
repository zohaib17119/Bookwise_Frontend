import { formatCurrency } from "@/lib/utils/format";

interface DocumentTotalsCardProps {
  currencyCode?: string | null;
  subtotal?: number | null;
  discountTotal?: number | null;
  taxTotal?: number | null;
  total?: number | null;
  title?: string;
}

export function DocumentTotalsCard({
  currencyCode,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  title = "Totals",
}: DocumentTotalsCardProps) {
  const currency = currencyCode ?? "USD";

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatCurrency(subtotal ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Discount</dt>
          <dd>{formatCurrency(discountTotal ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Tax</dt>
          <dd>{formatCurrency(taxTotal ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatCurrency(total ?? 0, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
