import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import {
  taxCodeSchema,
  type TaxCodeFormInput,
  type TaxCodeFormValues,
} from "@/features/tax/schemas/tax-code.schema";
import type { TaxCode, TaxRate } from "@/features/tax/types/tax.types";

interface TaxCodeFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  taxCode?: TaxCode | null;
  taxRates: TaxRate[];
  isPending?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: TaxCodeFormValues) => Promise<void>;
}

export function TaxCodeFormDrawer({
  open,
  mode,
  taxCode,
  taxRates,
  isPending,
  error,
  onClose,
  onSubmit,
}: TaxCodeFormDrawerProps) {
  const form = useForm<TaxCodeFormInput, undefined, TaxCodeFormValues>({
    resolver: zodResolver(taxCodeSchema),
    values: {
      name: taxCode?.name ?? "",
      code: taxCode?.code ?? "",
      description: taxCode?.description ?? "",
      calculationMode: taxCode?.calculationMode ?? "",
      scope: taxCode?.scope ?? "",
      isDefaultSales: Boolean(taxCode?.isDefaultSales),
      isDefaultPurchase: Boolean(taxCode?.isDefaultPurchase),
      isExempt: Boolean(taxCode?.isExempt),
      taxRateIds: taxCode?.taxRateIds ?? [],
    },
  });

  return (
    <CreateEditDrawer
      description="Group one or more tax rates under a reusable code for sales and purchase documents."
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
            {mode === "create" ? "Create tax code" : "Save tax code"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New tax code" : "Edit tax code"}
    >
      <form className="space-y-5">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <FieldGrid>
          <FormField error={form.formState.errors.name?.message} label="Name">
            <Input {...form.register("name")} placeholder="Standard sales tax" />
          </FormField>
          <FormField label="Code">
            <Input {...form.register("code")} placeholder="TAX-SALES" />
          </FormField>
          <FormField label="Calculation mode">
            <Select {...form.register("calculationMode")}>
              <option value="">Standard</option>
              <option value="exclusive">Exclusive</option>
              <option value="inclusive">Inclusive</option>
            </Select>
          </FormField>
          <FormField label="Scope">
            <Select {...form.register("scope")}>
              <option value="">General</option>
              <option value="sales">Sales</option>
              <option value="purchase">Purchase</option>
            </Select>
          </FormField>
        </FieldGrid>
        <FormField label="Description">
          <Textarea {...form.register("description")} placeholder="Describe when to use this tax code" />
        </FormField>
        <FormField label="Mapped tax rates">
          <Select
            multiple
            onChange={(event) =>
              form.setValue(
                "taxRateIds",
                Array.from(event.target.selectedOptions).map((option) => option.value),
              )
            }
            value={form.watch("taxRateIds")}
          >
            {taxRates.map((rate) => (
              <option key={rate.id} value={rate.id}>
                {rate.name}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isDefaultSales")}
              onChange={(event) => form.setValue("isDefaultSales", event.target.checked)}
            />
            Default sales code
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isDefaultPurchase")}
              onChange={(event) => form.setValue("isDefaultPurchase", event.target.checked)}
            />
            Default purchase code
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.watch("isExempt")}
              onChange={(event) => form.setValue("isExempt", event.target.checked)}
            />
            Exempt
          </label>
        </div>
      </form>
    </CreateEditDrawer>
  );
}
