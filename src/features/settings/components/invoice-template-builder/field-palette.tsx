import { Button } from "@/components/ui/button";
import {
  FIELD_GROUP_LABELS,
  INVOICE_FIELD_CATALOG,
  type InvoiceFieldGroup,
} from "@/features/settings/types/invoice-template.types";

interface FieldPaletteProps {
  canManage: boolean;
  selectedBoxId: string | null;
  onAddField: (binding: string, label: string) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddBoxBeforeTable: () => void;
  onAddBoxAfterTable: () => void;
  onAddSpecial: (kind: "lineTable" | "notes" | "footer") => void;
}

const GROUP_ORDER: InvoiceFieldGroup[] = ["invoice", "company", "customer", "totals"];

export function FieldPalette({
  canManage,
  selectedBoxId,
  onAddField,
  onAddText,
  onAddImage,
  onAddBoxBeforeTable,
  onAddBoxAfterTable,
  onAddSpecial,
}: FieldPaletteProps) {
  return (
    <div className="space-y-4">
      {!selectedBoxId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Select a box on the canvas, then click a field to add it inside that box.
        </p>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          Adding to selected box. Click a field below to insert a line inside it.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canManage || !selectedBoxId} onClick={onAddText} size="sm" type="button" variant="secondary">
          Add text line
        </Button>
        <Button disabled={!canManage || !selectedBoxId} onClick={onAddImage} size="sm" type="button" variant="secondary">
          Add image
        </Button>
        <Button
          disabled={!canManage}
          onClick={onAddBoxBeforeTable}
          size="sm"
          type="button"
          variant="secondary"
        >
          Add box before table
        </Button>
        <Button
          disabled={!canManage}
          onClick={onAddBoxAfterTable}
          size="sm"
          type="button"
          variant="secondary"
        >
          Add box after table
        </Button>
        <Button
          disabled={!canManage}
          onClick={() => onAddSpecial("lineTable")}
          size="sm"
          type="button"
          variant="secondary"
        >
          Line table
        </Button>
        <Button
          disabled={!canManage}
          onClick={() => onAddSpecial("notes")}
          size="sm"
          type="button"
          variant="secondary"
        >
          Notes
        </Button>
        <Button
          disabled={!canManage}
          onClick={() => onAddSpecial("footer")}
          size="sm"
          type="button"
          variant="secondary"
        >
          Footer
        </Button>
      </div>

      {GROUP_ORDER.map((group) => {
        const fields = INVOICE_FIELD_CATALOG.filter((field) => field.group === group);
        if (!fields.length) return null;
        return (
          <div className="space-y-2" key={group}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {FIELD_GROUP_LABELS[group]}
            </p>
            <ul className="space-y-1">
              {fields.map((field) => (
                <li key={field.binding}>
                  <button
                    className="w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!canManage || !selectedBoxId}
                    onClick={() => onAddField(field.binding, field.label)}
                    type="button"
                  >
                    {field.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
