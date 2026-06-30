import { formatCurrency } from "@/lib/utils/format";
import type { DocumentLineInput } from "@/features/shared/types/documents";
import { getLinePreviewTotal } from "@/features/shared/utils/document-calculations";

interface DocumentLinesTableProps {
  currencyCode?: string | null;
  fallbackCurrency?: string;
  lines: DocumentLineInput[];
  mode: "sales" | "purchase";
}

export function DocumentLinesTable({
  currencyCode,
  fallbackCurrency,
  lines,
  mode,
}: DocumentLinesTableProps) {
  const currency = currencyCode ?? fallbackCurrency ?? "USD";

  const getItemName = (line: DocumentLineInput) => line.itemName ?? line.item?.name ?? null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-4 py-3">Product/Service</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">
              {mode === "sales" ? "Unit Price" : "Unit Cost"}
            </th>
            <th className="px-4 py-3 text-right">Discount</th>
            <th className="px-4 py-3 text-right">Tax</th>
            <th className="px-4 py-3 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => {
            const itemName = getItemName(line);
            const description = line.description?.trim();
            const showDescription =
              description && description !== itemName?.trim();

            return (
            <tr
              className="border-b border-border/60 transition-colors even:bg-secondary/15 hover:bg-secondary/30"
              key={`${line.itemId ?? "line"}-${index}`}
            >
              <td className="px-4 py-4">
                <p className="font-medium">{itemName ?? "-"}</p>
              </td>
              <td className="px-4 py-4">
                {showDescription ? (
                  <p className="text-xs text-muted-foreground">{description}</p>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-right tabular-nums">{line.quantity}</td>
              <td className="px-4 py-4 text-right tabular-nums">
                {formatCurrency(line.unitPrice ?? line.unitCost ?? 0, currency)}
              </td>
              <td className="px-4 py-4 text-right tabular-nums">
                {line.discountType && line.discountValue
                  ? `${line.discountValue} ${line.discountType === "percentage" ? "%" : ""}`
                  : "-"}
              </td>
              <td className="px-4 py-4 text-right tabular-nums">{line.taxCode || "-"}</td>
              <td className="px-4 py-4 text-right font-medium tabular-nums">
                {formatCurrency(getLinePreviewTotal(line), currency)}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
