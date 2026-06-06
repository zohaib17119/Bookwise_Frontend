import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getAllocatedTotal } from "@/features/shared/utils/document-calculations";

export interface AllocationDocumentOption {
  id: string;
  number: string;
  documentDate?: string | null;
  dueDate?: string | null;
  amountDue?: number | null;
}

interface AllocationEditorProps {
  documents: AllocationDocumentOption[];
  allocations: Record<string, number>;
  currencyCode?: string | null;
  onAllocationChange: (documentId: string, amount: number) => void;
}

export function AllocationEditor({
  documents,
  allocations,
  currencyCode,
  onAllocationChange,
}: AllocationEditorProps) {
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
              <th className="px-4 py-3">Amount Due</th>
              <th className="px-4 py-3">Allocate</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr className="border-t border-border/60" key={document.id}>
                <td className="px-4 py-3 font-medium">{document.number}</td>
                <td className="px-4 py-3">{formatDate(document.documentDate)}</td>
                <td className="px-4 py-3">{formatDate(document.dueDate)}</td>
                <td className="px-4 py-3">
                  {formatCurrency(document.amountDue ?? 0, currencyCode ?? "USD")}
                </td>
                <td className="px-4 py-3">
                  <Input
                    min="0"
                    onChange={(event) =>
                      onAllocationChange(document.id, Number(event.target.value || 0))
                    }
                    step="0.01"
                    type="number"
                    value={allocations[document.id] ?? ""}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-right text-sm">
        <p className="text-muted-foreground">Allocated total</p>
        <p className="font-semibold">
          {formatCurrency(allocatedTotal, currencyCode ?? "USD")}
        </p>
      </div>
    </div>
  );
}
