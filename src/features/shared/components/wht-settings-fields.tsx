import type { UseFormReturn } from "react-hook-form";
import { FieldHint } from "@/components/shared/field-hint";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  WHT_BASE_HINTS,
  WHT_TYPE_HINT,
  defaultWhtHeldBy,
  whtHeldByHint,
  whtHeldByLabel,
  type WhtDocumentKind,
} from "@/features/shared/utils/wht-labels";

interface WhtSettingsFieldsProps {
  form: UseFormReturn<any>;
  documentKind: WhtDocumentKind;
  companyName?: string | null;
  enabled: boolean;
}

export function WhtSettingsFields({
  form,
  documentKind,
  companyName,
  enabled,
}: WhtSettingsFieldsProps) {
  const heldBy = form.watch("whtHeldBy") || defaultWhtHeldBy(documentKind);

  if (!enabled) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          WHT type
          <FieldHint text={WHT_TYPE_HINT} />
        </span>
        <Select {...form.register("whtType")} className="border p-1">
          <option value="">Select type</option>
          <option value="INCOME">Income WHT</option>
          <option value="SALES_TAX">Sales tax WHT</option>
        </Select>
      </label>

      <label className="space-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          Who holds WHT?
          <FieldHint text={whtHeldByHint(heldBy, documentKind, companyName)} />
        </span>
        <Select {...form.register("whtHeldBy")} className="border p-1">
          <option value="">Select holder</option>
          <option value="COUNTERPARTY">
            {documentKind === "invoice" ? "Held by customer" : "Held by vendor"}
          </option>
          <option value="COMPANY">
            {companyName ? `Held by ${companyName}` : "Held by us"}
          </option>
        </Select>
        <span className="block text-[11px]">{whtHeldByLabel(heldBy, documentKind, companyName)}</span>
      </label>

      <label className="space-y-1 text-xs text-muted-foreground">
        Rate %
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Rate %"
          {...form.register("whtRate")}
          className="border p-1"
        />
      </label>

      <label className="space-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          WHT base
          <FieldHint text="Choose whether WHT is calculated on subtotal, taxable amount, tax amount, or grand total." />
        </span>
        <Select {...form.register("whtBase")} className="border p-1">
          <option value="">Select base</option>
          <option value="SUBTOTAL" title={WHT_BASE_HINTS.SUBTOTAL}>
            Subtotal
          </option>
          <option value="TAXABLE" title={WHT_BASE_HINTS.TAXABLE}>
            Taxable (after discount)
          </option>
          <option value="TAX_AMOUNT" title={WHT_BASE_HINTS.TAX_AMOUNT}>
            Tax amount
          </option>
          <option value="TOTAL" title={WHT_BASE_HINTS.TOTAL}>
            Total (incl. tax)
          </option>
        </Select>
      </label>
    </div>
  );
}
