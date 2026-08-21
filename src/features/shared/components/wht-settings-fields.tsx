import type { UseFormReturn } from "react-hook-form";
import { FieldHint } from "@/components/shared/field-hint";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  WHT_BASE_HINTS,
  defaultWhtHeldBy,
  whtHeldByHint,
  whtHeldByLabel,
  type WhtDocumentKind,
} from "@/features/shared/utils/wht-labels";

interface WhtSettingsFieldsProps {
  form: UseFormReturn<any>;
  documentKind: WhtDocumentKind;
  companyName?: string | null;
}

function WhtSlotFields({
  form,
  prefix,
  title,
  documentKind,
  companyName,
}: {
  form: UseFormReturn<any>;
  prefix: "incomeWht" | "salesTaxWht";
  title: string;
  documentKind: WhtDocumentKind;
  companyName?: string | null;
}) {
  const enabled = Boolean(form.watch(`${prefix}Enabled`));
  const heldByField = `${prefix}HeldBy` as const;
  const heldBy = form.watch(heldByField) || defaultWhtHeldBy(documentKind);

  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          checked={enabled}
          className="h-4 w-4"
          onChange={(event) => {
            form.setValue(`${prefix}Enabled`, event.target.checked, {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (event.target.checked && !form.getValues(heldByField)) {
              form.setValue(heldByField, defaultWhtHeldBy(documentKind), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
          type="checkbox"
        />
        <span>{title}</span>
      </label>
      {enabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            Rate %
            <Input
              className="border p-1"
              min="0"
              placeholder="Rate %"
              step="0.01"
              type="number"
              {...form.register(`${prefix}Rate`)}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              WHT base
              <FieldHint text="Choose whether WHT is calculated on subtotal, taxable amount, tax amount, or grand total." />
            </span>
            <Select {...form.register(`${prefix}Base`)} className="border p-1">
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
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
            <span className="inline-flex items-center gap-1">
              Who holds this WHT?
              <FieldHint text={whtHeldByHint(heldBy, documentKind, companyName)} />
            </span>
            <Select {...form.register(heldByField)} className="border p-1">
              <option value="">Select holder</option>
              <option value="COUNTERPARTY">
                {documentKind === "invoice" ? "Held by customer" : "Held by vendor"}
              </option>
              <option value="COMPANY">
                {companyName ? `Held by ${companyName}` : "Held by us"}
              </option>
            </Select>
            <span className="block text-[11px]">
              {whtHeldByLabel(heldBy, documentKind, companyName)}
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}

export function WhtSettingsFields({
  form,
  documentKind,
  companyName,
}: WhtSettingsFieldsProps) {
  return (
    <div className="space-y-3">
      <WhtSlotFields
        companyName={companyName}
        documentKind={documentKind}
        form={form}
        prefix="incomeWht"
        title="Add income tax WHT"
      />
      <WhtSlotFields
        companyName={companyName}
        documentKind={documentKind}
        form={form}
        prefix="salesTaxWht"
        title="Add sales tax WHT"
      />
    </div>
  );
}
