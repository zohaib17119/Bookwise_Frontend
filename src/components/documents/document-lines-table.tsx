import { formatCurrency } from "@/lib/utils/format";
import type { DocumentLineInput } from "@/features/shared/types/documents";
import { getLinePreviewTotal } from "@/features/shared/utils/document-calculations";

interface DocumentLinesTableProps {
  currencyCode?: string | null;
  lines: DocumentLineInput[];
  mode: "sales" | "purchase";
}

export function DocumentLinesTable({
  currencyCode,
  lines,
  mode,
}: DocumentLinesTableProps) {
  const currency = currencyCode ?? "USD";

  const getItemName = (line: DocumentLineInput) => line.itemName ?? line.item?.name ?? null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-4 py-3">Product/Service</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">
              {mode === "sales" ? "Unit Price" : "Unit Cost"}
            </th>
            <th className="px-4 py-3">Discount</th>
            <th className="px-4 py-3">Tax</th>
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
            <tr className="border-t border-border/60" key={`${line.itemId ?? "line"}-${index}`}>
              <td className="px-4 py-3">
                <p className="font-medium">{itemName ?? "-"}</p>
              </td>
              <td className="px-4 py-3">
                {showDescription ? (
                  <p className="text-xs text-muted-foreground">{description}</p>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3">{line.quantity}</td>
              <td className="px-4 py-3">
                {formatCurrency(line.unitPrice ?? line.unitCost ?? 0, currency)}
              </td>
              <td className="px-4 py-3">
                {line.discountType && line.discountValue
                  ? `${line.discountValue} ${line.discountType === "percentage" ? "%" : ""}`
                  : "-"}
              </td>
              <td className="px-4 py-3">{line.taxCode || "-"}</td>
              <td className="px-4 py-3 text-right font-medium">
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
