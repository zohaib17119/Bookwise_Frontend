import { formatCurrency, formatDate } from "@/lib/utils/format";

interface InventoryMovementRow {
  id: string;
  itemName?: string | null;
  movementDate?: string | null;
  movementType?: string | null;
  direction?: string | null;
  quantity?: number | null;
  unitCost?: number | null;
  sourceModule?: string | null;
}

interface InventoryMovementTableProps {
  data: InventoryMovementRow[];
  currencyCode?: string | null;
}

export function InventoryMovementTable({
  data,
  currencyCode,
}: InventoryMovementTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Direction</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Unit Cost</th>
            <th className="px-4 py-3">Source</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr className="border-t border-border/60" key={row.id}>
              <td className="px-4 py-3">{formatDate(row.movementDate)}</td>
              <td className="px-4 py-3 font-medium">{row.itemName || "-"}</td>
              <td className="px-4 py-3">{row.movementType || "-"}</td>
              <td className="px-4 py-3">{row.direction || "-"}</td>
              <td className="px-4 py-3">{row.quantity ?? 0}</td>
              <td className="px-4 py-3">
                {formatCurrency(row.unitCost ?? 0, currencyCode ?? "USD")}
              </td>
              <td className="px-4 py-3">{row.sourceModule || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
