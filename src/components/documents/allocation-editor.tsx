import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { clampAllocationAmount, parseMoney, toMoneyString } from "@/lib/utils/money";
import { getAllocatedTotal } from "@/features/shared/utils/document-calculations";

export interface AllocationDocumentOption {
  id: string;
  number: string;
  documentDate?: string | null;
  dueDate?: string | null;
  /** Cash remaining that can be allocated (net settlement − cash paid when WHT). */
  amountDue?: number | string | null;
  total?: number | string | null;
  whtEnabled?: boolean | null;
  whtAmount?: number | string | null;
  whtRate?: number | string | null;
  whtType?: "INCOME" | "SALES_TAX" | string | null;
  netSettlementAmount?: number | string | null;
}

interface AllocationEditorProps {
  documents: AllocationDocumentOption[];
  allocations: Record<string, number>;
  currencyCode?: string | null;
  /** Customer payments: Receivable; bill payments: Payable */
  settlementLabel?: "Receivable" | "Payable";
  onAllocationChange: (documentId: string, amount: number) => void;
}

export function AllocationEditor({
  documents,
  allocations,
  currencyCode,
  settlementLabel = "Receivable",
  onAllocationChange,
}: AllocationEditorProps) {
  const currency = currencyCode ?? "USD";
  const allocatedTotal = getAllocatedTotal(
    Object.entries(allocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">WHT</th>
              <th className="px-4 py-3 text-right">{settlementLabel}</th>
              <th className="px-4 py-3 text-right">Cash due</th>
              <th className="px-4 py-3">Allocate</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const amountDue = parseMoney(document.amountDue);
              const total = parseMoney(document.total);
              const whtAmount = document.whtEnabled ? parseMoney(document.whtAmount) : 0;
              const receivable = document.whtEnabled
                ? parseMoney(
                    document.netSettlementAmount != null && document.netSettlementAmount !== ""
                      ? document.netSettlementAmount
                      : Math.max(total - whtAmount, 0),
                  )
                : total;
              const currentValue = allocations[document.id] ?? "";
              const rate =
                document.whtEnabled && document.whtRate != null && document.whtRate !== ""
                  ? `@${Number(document.whtRate)}%`
                  : "";
              const type =
                document.whtType === "INCOME"
                  ? "Income"
                  : document.whtType === "SALES_TAX"
                    ? "Sales tax"
                    : "";

              return (
                <tr className="border-t border-border/60" key={document.id}>
                  <td className="px-4 py-3 font-medium">{document.number}</td>
                  <td className="px-4 py-3">{formatDate(document.documentDate)}</td>
                  <td className="px-4 py-3">{formatDate(document.dueDate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(toMoneyString(total), currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {document.whtEnabled && whtAmount > 0 ? (
                      <div>
                        <p className="tabular-nums">
                          WHT {rate}
                          {type ? ` (${type})` : ""}
                        </p>
                        <p className="tabular-nums text-muted-foreground">
                          {formatCurrency(toMoneyString(whtAmount), currency)}
                        </p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(toMoneyString(receivable), currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(toMoneyString(amountDue), currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Input
                        max={amountDue > 0 ? amountDue : undefined}
                        min="0"
                        onChange={(event) =>
                          onAllocationChange(
                            document.id,
                            clampAllocationAmount(Number(event.target.value || 0), amountDue),
                          )
                        }
                        step="0.01"
                        type="number"
                        value={currentValue}
                      />
                      <Button
                        disabled={amountDue <= 0}
                        onClick={() =>
                          onAllocationChange(document.id, Number(toMoneyString(amountDue)))
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Apply due
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-right text-sm">
        <p className="text-muted-foreground">Allocated total</p>
        <p className="font-semibold">
          {formatCurrency(toMoneyString(allocatedTotal), currency)}
        </p>
      </div>
    </div>
  );
}
