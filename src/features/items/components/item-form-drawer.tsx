import { useEffect } from "react";
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
import { FormSection } from "@/components/shared/form-section";
import type { ApiError } from "@/lib/api/types";
import {
  itemSchema,
  type ItemFormInput,
  type ItemFormValues,
} from "@/features/items/schemas/item.schema";
import type { Item } from "@/features/items/types/item.types";
import type { Account } from "@/features/accounts/types/account.types";
import type { Vendor } from "@/features/vendors/types/vendor.types";
import type { TaxRate } from "@/features/tax/types/tax.types";

interface ItemFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  item?: Item | null;
  accounts: Account[];
  vendors: Vendor[];
  taxRates: TaxRate[];
  isPending?: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
}

export function ItemFormDrawer({
  open,
  mode,
  item,
  accounts,
  vendors,
  taxRates,
  isPending,
  error,
  onClose,
  onSubmit,
}: ItemFormDrawerProps) {
  const form = useForm<ItemFormInput, undefined, ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      itemCode: "",
      name: "",
      description: "",
      type: "service",
      sku: "",
      unitName: "",
      salesPrice: undefined,
      purchaseCost: undefined,
      incomeAccountId: "",
      expenseAccountId: "",
      assetAccountId: "",
      preferredVendorId: "",
      taxable: false,
      taxRateId: "",
      trackQuantity: false,
      quantityOnHand: undefined,
      reorderLevel: undefined,
      isActive: true,
    },
  });

  const itemType = form.watch("type");
  const trackQuantity = form.watch("trackQuantity");

  useEffect(() => {
    if (!open) return;
    form.reset({
      itemCode: item?.itemCode ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      type: item?.type ?? "service",
      sku: item?.sku ?? "",
      unitName: item?.unitName ?? "",
      salesPrice: item?.salesPrice ?? undefined,
      purchaseCost: item?.purchaseCost ?? undefined,
      incomeAccountId: item?.incomeAccountId ?? "",
      expenseAccountId: item?.expenseAccountId ?? "",
      assetAccountId: item?.assetAccountId ?? "",
      preferredVendorId: item?.preferredVendorId ?? "",
      taxable: item?.taxable ?? false,
      taxRateId: item?.taxRateId ?? "",
      trackQuantity: item?.trackQuantity ?? false,
      quantityOnHand: item?.quantityOnHand ?? undefined,
      reorderLevel: item?.reorderLevel ?? undefined,
      isActive: item?.isActive ?? true,
    });
  }, [form, item, open]);

  useEffect(() => {
    if (itemType === "service") {
      form.setValue("trackQuantity", false);
      form.setValue("quantityOnHand", undefined);
      form.setValue("reorderLevel", undefined);
      form.setValue("assetAccountId", "");
    }
  }, [form, itemType]);

  return (
    <CreateEditDrawer
      description="Maintain products and services with account links, purchasing defaults, and quantity controls."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={isPending}
            onClick={form.handleSubmit(async (values) => onSubmit(values))}
            type="button"
          >
            {mode === "create" ? "Create item" : "Save changes"}
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title={mode === "create" ? "New item" : `Edit ${item?.name ?? "item"}`}
    >
      <form className="space-y-6">
        {error ? <Alert title={error.message} variant="destructive" /> : null}
        <FormSection title="Item profile" description="Core identity and commercial defaults.">
          <FieldGrid>
            <FormField label="Item code">
              <Input {...form.register("itemCode")} placeholder="ITEM-001" />
            </FormField>
            <FormField label="Name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Consulting retainer" />
            </FormField>
            <FormField label="Type">
              <Select {...form.register("type")}>
                <option value="service">Service</option>
                <option value="non_inventory">Non-inventory</option>
                <option value="inventory">Inventory</option>
              </Select>
            </FormField>
            <FormField label="SKU">
              <Input {...form.register("sku")} placeholder="SKU-1001" />
            </FormField>
            <FormField label="Unit name">
              <Input {...form.register("unitName")} placeholder="Each" />
            </FormField>
            <FormField label="Tax rate">
              <Select {...form.register("taxRateId")}>
                <option value="">No tax</option>
                {taxRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name} ({rate.ratePercent}%)
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Sales price">
              <Input type="number" step="0.01" {...form.register("salesPrice")} />
            </FormField>
            <FormField label="Purchase cost">
              <Input type="number" step="0.01" {...form.register("purchaseCost")} />
            </FormField>
          </FieldGrid>
          <FormField label="Description">
            <Textarea {...form.register("description")} />
          </FormField>
        </FormSection>

        <FormSection title="Accounting links" description="Default accounts for sales, purchases, and stock.">
          <FieldGrid>
            <FormField label="Income account">
              <Select {...form.register("incomeAccountId")}>
                <option value="">Select income account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {(account.code ? `${account.code} - ` : "") + account.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Expense account">
              <Select {...form.register("expenseAccountId")}>
                <option value="">Select expense account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {(account.code ? `${account.code} - ` : "") + account.name}
                  </option>
                ))}
              </Select>
            </FormField>
            {itemType === "inventory" ? (
              <FormField label="Asset account">
                <Select {...form.register("assetAccountId")}>
                  <option value="">Select asset account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {(account.code ? `${account.code} - ` : "") + account.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <FormField label="Preferred vendor">
              <Select {...form.register("preferredVendorId")}>
                <option value="">No preferred vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.displayName}
                  </option>
                ))}
              </Select>
            </FormField>
          </FieldGrid>
        </FormSection>

        <FormSection title="Flags and stock behavior">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
              <Checkbox
                checked={form.watch("taxable")}
                onChange={(event) => form.setValue("taxable", event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium">Taxable item</p>
                <p className="text-xs text-muted-foreground">
                  Use tax configuration when this item appears in sales flows.
                </p>
              </div>
            </div>
            {itemType !== "service" ? (
              <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
                <Checkbox
                  checked={trackQuantity}
                  onChange={(event) => form.setValue("trackQuantity", event.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium">Track quantity on hand</p>
                  <p className="text-xs text-muted-foreground">
                    Enable on-hand quantity and reorder thresholds for stocked items.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
              <Checkbox
                checked={form.watch("isActive")}
                onChange={(event) => form.setValue("isActive", event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium">Active item</p>
                <p className="text-xs text-muted-foreground">
                  Inactive items remain in history and reports.
                </p>
              </div>
            </div>
          </div>

          {itemType === "inventory" || trackQuantity ? (
            <FieldGrid>
              <FormField label="Quantity on hand">
                <Input type="number" step="0.01" {...form.register("quantityOnHand")} />
              </FormField>
              <FormField label="Reorder level">
                <Input type="number" step="0.01" {...form.register("reorderLevel")} />
              </FormField>
            </FieldGrid>
          ) : null}
        </FormSection>
      </form>
    </CreateEditDrawer>
  );
}
