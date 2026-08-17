import { FieldHint } from "@/components/shared/field-hint";
import { formatCurrency } from "@/lib/utils/format";

interface DocumentTotalsCardProps {
  currencyCode?: string | null;
  fallbackCurrency?: string;
  subtotal?: number | string | null;
  discountTotal?: number | string | null;
  taxTotal?: number | string | null;
  total?: number | string | null;
  whtAmount?: number | string | null;
  netSettlementAmount?: number | string | null;
  netLabel?: string;
  whtHeldByLabel?: string;
  whtHeldByHint?: string;
  whtAddsToTotal?: boolean;
  title?: string;
}

export function DocumentTotalsCard({
  currencyCode,
  fallbackCurrency,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  whtAmount,
  netSettlementAmount,
  netLabel = "Net settlement",
  whtHeldByLabel,
  whtHeldByHint,
  whtAddsToTotal = false,
  title = "Totals",
}: DocumentTotalsCardProps) {
  const currency = currencyCode ?? fallbackCurrency ?? "USD";
  const showWht =
    whtAmount != null &&
    whtAmount !== "" &&
    Number(whtAmount) > 0;

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
        {showWht ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <dt className="inline-flex items-center gap-1 text-muted-foreground">
                Withholding tax
                {whtHeldByLabel ? (
                  <>
                    <span className="text-xs">({whtHeldByLabel})</span>
                    {whtHeldByHint ? <FieldHint text={whtHeldByHint} /> : null}
                  </>
                ) : null}
              </dt>
              <dd className="text-right tabular-nums">
                {whtAddsToTotal ? "+" : "-"}
                {formatCurrency(whtAmount ?? 0, currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 font-semibold">
              <dt>{netLabel}</dt>
              <dd className="text-right tabular-nums">
                {formatCurrency(netSettlementAmount ?? total ?? 0, currency)}
              </dd>
            </div>
          </>
        ) : null}
      </dl>
    </div>
  );
}
