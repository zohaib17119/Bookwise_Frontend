import { formatCurrency } from "@/lib/utils/format";
import type { DocumentLineInput } from "@/features/shared/types/documents";
import { getLinePreviewTotal } from "@/features/shared/utils/document-calculations";

interface DocumentLinesTableProps {
  currencyCode?: string | null;
  fallbackCurrency?: string;
  lines: DocumentLineInput[];
  mode: "sales" | "purchase";
  /** Internal invoice detail only — not used on customer PDFs. */
  showHsCode?: boolean;
}

function formatTaxLabel(line: DocumentLineInput): string {
  return (
    line.taxName?.trim() ||
    line.taxCodeRef?.name?.trim() ||
    line.taxCodeRef?.code?.trim() ||
    line.taxCode?.trim() ||
    (line.taxRate ? `${line.taxRate}%` : "") ||
    "-"
  );
}

export function DocumentLinesTable({
  currencyCode,
  fallbackCurrency,
  lines,
  mode,
  showHsCode = false,
}: DocumentLinesTableProps) {
  const currency = currencyCode ?? fallbackCurrency ?? "USD";

  const getItemName = (line: DocumentLineInput) => line.itemName ?? line.item?.name ?? null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-4 py-3">Product/Service</th>
            {showHsCode ? <th className="px-4 py-3">HS / Item code</th> : null}
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
            const hsCode = line.hsCode ?? line.item?.hsCode ?? null;
            const itemCode = line.itemCode ?? line.item?.itemCode ?? null;
            const codeLabel = [hsCode, itemCode].filter(Boolean).join(" / ") || "-";

            return (
              <tr
                className="border-b border-border/60 transition-colors even:bg-secondary/15 hover:bg-secondary/30"
                key={`${line.itemId ?? "line"}-${index}`}
              >
                <td className="px-4 py-4">
                  <p className="font-medium">{itemName ?? "-"}</p>
                </td>
                {showHsCode ? (
                  <td className="px-4 py-4 tabular-nums text-muted-foreground">{codeLabel}</td>
                ) : null}
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
                    ? `${line.discountValue} ${line.discountType === "PERCENTAGE" ? "%" : ""}`
                    : "-"}
                </td>
                <td className="px-4 py-4 text-right tabular-nums">{formatTaxLabel(line)}</td>
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
