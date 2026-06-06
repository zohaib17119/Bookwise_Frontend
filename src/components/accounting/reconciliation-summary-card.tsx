import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface ReconciliationSummaryCardProps {
  statementEndingBalance?: number | null;
  clearedBalance?: number | null;
  difference?: number | null;
  currencyCode?: string | null;
  status?: string | null;
}

export function ReconciliationSummaryCard({
  statementEndingBalance,
  clearedBalance,
  difference,
  currencyCode,
  status,
}: ReconciliationSummaryCardProps) {
  const isBalanced = Math.abs(difference ?? 0) < 0.0001;
  const currency = currencyCode ?? "USD";

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold">Reconciliation summary</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em]",
            isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
          )}
        >
          {status ?? (isBalanced ? "Balanced" : "In progress")}
        </span>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Statement ending balance</dt>
          <dd>{formatCurrency(statementEndingBalance ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Cleared balance</dt>
          <dd>{formatCurrency(clearedBalance ?? 0, currency)}</dd>
        </div>
        <div className="flex items-center justify-between border-t pt-3 font-semibold">
          <dt>Difference</dt>
          <dd>{formatCurrency(difference ?? 0, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
