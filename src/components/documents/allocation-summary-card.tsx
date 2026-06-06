import { formatCurrency } from "@/lib/utils/format";
import type { AllocationEntry } from "@/features/shared/types/documents";

interface AllocationSummaryCardProps {
  allocations: AllocationEntry[];
  currencyCode?: string | null;
  totalAmount?: number | null;
  unappliedAmount?: number | null;
  title: string;
}

export function AllocationSummaryCard({
  allocations,
  currencyCode,
  totalAmount,
  unappliedAmount,
  title,
}: AllocationSummaryCardProps) {
  const currency = currencyCode ?? "USD";

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Payment amount</span>
          <span className="font-medium">{formatCurrency(totalAmount ?? 0, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Unapplied amount</span>
          <span className="font-medium">
            {formatCurrency(unappliedAmount ?? 0, currency)}
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-3 border-t pt-4">
        {allocations.length ? (
          allocations.map((allocation) => (
            <div
              className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3"
              key={`${allocation.documentId}-${allocation.documentNumber}`}
            >
              <div>
                <p className="font-medium">{allocation.documentNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Due remaining: {formatCurrency(allocation.amountDue ?? 0, currency)}
                </p>
              </div>
              <p className="font-medium">
                {formatCurrency(allocation.allocatedAmount, currency)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No allocations applied yet.
          </p>
        )}
      </div>
    </div>
  );
}
