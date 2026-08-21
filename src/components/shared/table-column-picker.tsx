import { Columns3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TableViewColumnDef } from "@/hooks/use-table-view-preferences";

type TableColumnPickerProps = {
  columns: TableViewColumnDef[];
  order: string[];
  hidden: string[];
  onToggle: (columnId: string, visible: boolean) => void;
  onMove: (columnId: string, direction: "up" | "down") => void;
  onReset: () => void;
};

export function TableColumnPicker({
  columns,
  order,
  hidden,
  onToggle,
  onMove,
  onReset,
}: TableColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const byId = new Map(columns.map((column) => [column.id, column]));

  return (
    <div className="relative">
      <Button onClick={() => setOpen((value) => !value)} type="button" variant="outline">
        <Columns3 className="mr-2 h-4 w-4" />
        View
      </Button>
      {open ? (
        <>
          <button
            aria-label="Close column picker"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-border bg-background p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Columns</p>
              <Button onClick={onReset} size="sm" type="button" variant="ghost">
                Reset
              </Button>
            </div>
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {order.map((columnId, index) => {
                const column = byId.get(columnId);
                if (!column) return null;
                const visible = !hidden.includes(columnId);
                return (
                  <li
                    className="flex items-center gap-2 rounded-xl border border-border/70 px-2 py-1.5"
                    key={columnId}
                  >
                    <Checkbox
                      checked={visible}
                      id={`col-${columnId}`}
                      onChange={(event) => onToggle(columnId, event.target.checked)}
                    />
                    <label className="flex-1 text-sm" htmlFor={`col-${columnId}`}>
                      {column.label}
                    </label>
                    <div className="flex gap-1">
                      <Button
                        disabled={index === 0}
                        onClick={() => onMove(columnId, "up")}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        ↑
                      </Button>
                      <Button
                        disabled={index === order.length - 1}
                        onClick={() => onMove(columnId, "down")}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        ↓
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
