import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { taxRateSchema, type TaxRateFormInput, type TaxRateFormValues } from "@/features/tax/schemas/tax-rate.schema";
import type { TaxRate } from "@/features/tax/types/tax.types";

interface TaxRateFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  taxRate?: TaxRate | null;
  isPending?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: TaxRateFormValues) => Promise<void>;
}

export function TaxRateFormDrawer({
  open,
  mode,
  taxRate,
  isPending,
  error,
  onClose,
  onSubmit,
}: TaxRateFormDrawerProps) {
  const form = useForm<TaxRateFormInput, undefined, TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema),
    values: {
      name: taxRate?.name ?? "",
      code: taxRate?.code ?? "",
      ratePercent: taxRate?.ratePercent ?? 0,
      scope: taxRate?.scope ?? "",
      isCompound: Boolean(taxRate?.isCompound),
      isRecoverable: Boolean(taxRate?.isRecoverable),
      isActive: taxRate?.isActive ?? true,
    },
  });

  return (
    <CreateEditDrawer
      description="Define the tax percentage behavior available to tax codes and transactions."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={isPending}
            onClick={form.handleSubmit(onSubmit)}
            type="button"
          >
            {mode === "create" ? "Create tax rate" : "Save tax rate"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New tax rate" : "Edit tax rate"}
    >
      <form className="space-y-5">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <FieldGrid>
          <FormField error={form.formState.errors.name?.message} label="Name">
            <Input {...form.register("name")} placeholder="VAT 15%" />
          </FormField>
          <FormField label="Code">
            <Input {...form.register("code")} placeholder="VAT15" />
          </FormField>
          <FormField error={form.formState.errors.ratePercent?.message} label="Rate percent">
            <Input step="0.01" type="number" {...form.register("ratePercent")} />
          </FormField>
          <FormField label="Scope">
            <Select {...form.register("scope")}>
              <option value="">General</option>
              <option value="sales">Sales</option>
              <option value="purchase">Purchase</option>
            </Select>
          </FormField>
        </FieldGrid>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isCompound")}
              onChange={(event) => form.setValue("isCompound", event.target.checked)}
            />
            Compound tax
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isRecoverable")}
              onChange={(event) => form.setValue("isRecoverable", event.target.checked)}
            />
            Recoverable
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isActive")}
              onChange={(event) => form.setValue("isActive", event.target.checked)}
            />
            Active
          </label>
        </div>
      </form>
    </CreateEditDrawer>
  );
}
