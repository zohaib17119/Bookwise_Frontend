import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedSection } from "@/components/shared/advanced-section";
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
import type { HsCodeCategory } from "@/features/items/types/hs-code-category.types";
import type { Account } from "@/features/accounts/types/account.types";
import type { Vendor } from "@/features/vendors/types/vendor.types";
import type { TaxRate } from "@/features/tax/types/tax.types";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCreateHsCodeCategory } from "@/features/items/hooks/use-hs-code-categories";
import { useNextItemSku } from "@/features/items/hooks/use-items";
import {
  useCreateUnitOfMeasure,
  useUnitsOfMeasure,
} from "@/features/items/hooks/use-units-of-measure";
import { cn } from "@/lib/utils/cn";

const ADD_NEW_HS_CODE = "__add_new_hs_code__";
const ADD_NEW_UNIT = "__add_new_unit__";

interface ItemFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  item?: Item | null;
  baseCurrencyCode?: string;
  accounts: Account[];
  vendors: Vendor[];
  taxRates: TaxRate[];
  hsCodeCategories: HsCodeCategory[];
  isPending?: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
}

export function ItemFormDrawer({
  open,
  mode,
  item,
  baseCurrencyCode = "USD",
  accounts,
  vendors,
  taxRates,
  hsCodeCategories,
  isPending,
  error,
  onClose,
  onSubmit,
}: ItemFormDrawerProps) {
  const { companyId } = useActiveCompany();
  const nextSkuQuery = useNextItemSku(companyId, open && mode === "create");
  const unitsQuery = useUnitsOfMeasure(open);
  const createHsCodeMutation = useCreateHsCodeCategory(companyId);
  const createUnitMutation = useCreateUnitOfMeasure();

  const [hsModalOpen, setHsModalOpen] = useState(false);
  const [newHsCode, setNewHsCode] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [hsModalError, setHsModalError] = useState<string | null>(null);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitGroup, setNewUnitGroup] = useState("");
  const [unitModalError, setUnitModalError] = useState<string | null>(null);

  const units = unitsQuery.data ?? [];

  const form = useForm<ItemFormInput, undefined, ItemFormValues>({
    resolver: zodResolver(itemSchema),
    mode: "onSubmit",
    defaultValues: {
      itemCode: "",
      name: "",
      description: "",
      type: "inventory",
      sku: "",
      barcode: "",
      unitName: "ea",
      hsCode: "",
      salesPrice: "0",
      purchaseCost: "0",
      incomeAccountId: "",
      expenseAccountId: "",
      assetAccountId: "",
      preferredVendorId: "",
      taxable: true,
      taxRateId: "",
      trackQuantity: true,
      quantityOnHand: undefined,
      reorderLevel: undefined,
      isActive: true,
    },
  });

  const itemType = form.watch("type");
  const trackQuantity = form.watch("trackQuantity");
  const taxRateId = form.watch("taxRateId");
  const selectedHsCode = form.watch("hsCode");
  const selectedUnit = form.watch("unitName");
  const hasAccountOverrides = Boolean(
    item?.incomeAccountId || item?.expenseAccountId || item?.assetAccountId,
  );

  useEffect(() => {
    if (!open) return;
    form.reset({
      itemCode: item?.itemCode ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      type: item?.type ?? "inventory",
      sku: item?.sku ?? "",
      barcode: item?.barcode ?? "",
      unitName: item?.unitName ?? "ea",
      hsCode: item?.hsCode ?? "",
      salesPrice: item?.salesPrice ?? "0",
      purchaseCost: item?.purchaseCost ?? "0",
      incomeAccountId: item?.incomeAccountId ?? "",
      expenseAccountId: item?.expenseAccountId ?? "",
      assetAccountId: item?.assetAccountId ?? "",
      preferredVendorId: item?.preferredVendorId ?? "",
      taxable: item?.taxable ?? true,
      taxRateId: item?.taxRateId ?? "",
      trackQuantity: item?.trackQuantity ?? true,
      quantityOnHand: item?.quantityOnHand ?? undefined,
      reorderLevel: item?.reorderLevel ?? undefined,
      isActive: item?.isActive ?? true,
    });
    setHsModalOpen(false);
    setUnitModalOpen(false);
    setHsModalError(null);
    setUnitModalError(null);
  }, [form, item, open]);

  useEffect(() => {
    if (!open || mode !== "create" || !nextSkuQuery.data) return;
    if (!form.getValues("sku")) {
      form.setValue("sku", nextSkuQuery.data);
    }
  }, [form, mode, nextSkuQuery.data, open]);

  useEffect(() => {
    if (itemType === "service") {
      form.setValue("trackQuantity", false);
      form.setValue("quantityOnHand", undefined);
      form.setValue("reorderLevel", undefined);
      form.setValue("assetAccountId", "");
    } else if (itemType === "inventory" && mode === "create") {
      form.setValue("trackQuantity", true);
    }
  }, [form, itemType, mode]);

  useEffect(() => {
    if (taxRateId) {
      form.setValue("taxable", true);
    }
  }, [form, taxRateId]);

  const handleHsCodeSelect = (value: string) => {
    if (value === ADD_NEW_HS_CODE) {
      setHsModalOpen(true);
      setHsModalError(null);
      return;
    }
    form.setValue("hsCode", value, { shouldValidate: true });
  };

  const handleUnitSelect = (value: string) => {
    if (value === ADD_NEW_UNIT) {
      setUnitModalOpen(true);
      setUnitModalError(null);
      return;
    }
    form.setValue("unitName", value, { shouldValidate: true });
  };

  const handleCreateHsCode = async () => {
    const code = newHsCode.trim();
    const categoryName = newCategoryName.trim();
    if (!code || !categoryName) {
      setHsModalError("HS code and category name are required");
      return;
    }
    setHsModalError(null);
    try {
      const created = await createHsCodeMutation.mutateAsync({ code, categoryName });
      form.setValue("hsCode", created.code, { shouldValidate: true });
      setHsModalOpen(false);
      setNewHsCode("");
      setNewCategoryName("");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to create HS code";
      setHsModalError(message);
    }
  };

  const handleCreateUnit = async () => {
    const code = newUnitCode.trim();
    const name = newUnitName.trim();
    if (!code || !name) {
      setUnitModalError("Unit code and name are required");
      return;
    }
    setUnitModalError(null);
    try {
      const created = await createUnitMutation.mutateAsync({
        code,
        name,
        group: newUnitGroup.trim() || undefined,
      });
      form.setValue("unitName", created.code, { shouldValidate: true });
      setUnitModalOpen(false);
      setNewUnitCode("");
      setNewUnitName("");
      setNewUnitGroup("");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to create unit";
      setUnitModalError(message);
    }
  };

  return (
    <>
      <CreateEditDrawer
        description="Required: name, HS code, and tax. Costs default to 0; unit defaults to Each."
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
          <FormSection title="Item profile" description="Minimal required fields for fast entry.">
            <FieldGrid>
              <FormField label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} placeholder="Paper cup" />
              </FormField>
              <FormField
                error={form.formState.errors.hsCode?.message}
                helperText="Select an existing HS category or add a new one."
                label="Item code / HS code"
              >
                <Select onChange={(event) => handleHsCodeSelect(event.target.value)} value={selectedHsCode || ""}>
                  <option value="">Select HS code</option>
                  {selectedHsCode &&
                  !hsCodeCategories.some((category) => category.code === selectedHsCode) ? (
                    <option value={selectedHsCode}>{selectedHsCode}</option>
                  ) : null}
                  {hsCodeCategories.map((category) => (
                    <option key={category.id} value={category.code}>
                      {`${category.code}(${category.categoryName})`}
                    </option>
                  ))}
                  <option value={ADD_NEW_HS_CODE}>Add new HS code…</option>
                </Select>
              </FormField>
              <FormField label="Type">
                <Select {...form.register("type")}>
                  <option value="inventory">Inventory</option>
                  <option value="non_inventory">Non-inventory</option>
                  <option value="service">Service</option>
                </Select>
              </FormField>
              <FormField helperText="Auto-generated on create. You can edit it." label="SKU">
                <Input {...form.register("sku")} placeholder="SKU-01" />
              </FormField>
              <FormField error={form.formState.errors.taxRateId?.message} label="Tax rate">
                <Select
                  value={taxRateId || ""}
                  onChange={(event) => {
                    form.setValue("taxRateId", event.target.value, { shouldValidate: true });
                    if (event.target.value) form.setValue("taxable", true);
                  }}
                >
                  <option value="">Select tax rate</option>
                  {taxRates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.name} ({rate.ratePercent}%)
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                helperText={`Defaults to 0. Entered in ${baseCurrencyCode}.`}
                label="Purchase cost"
              >
                <Input type="number" step="0.01" {...form.register("purchaseCost")} />
              </FormField>
              <FormField
                helperText={`Defaults to 0. Entered in ${baseCurrencyCode}.`}
                label="Sales price"
              >
                <Input type="number" step="0.01" {...form.register("salesPrice")} />
              </FormField>
              <FormField label="Unit">
                <Select onChange={(event) => handleUnitSelect(event.target.value)} value={selectedUnit || ""}>
                  <option value="">Select unit</option>
                  {selectedUnit && !units.some((unit) => unit.code === selectedUnit) ? (
                    <option value={selectedUnit}>{selectedUnit}</option>
                  ) : null}
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.code}>
                      {`${unit.name} (${unit.code})`}
                    </option>
                  ))}
                  <option value={ADD_NEW_UNIT}>Add new unit…</option>
                </Select>
              </FormField>
              <FormField label="Barcode (optional)">
                <Input {...form.register("barcode")} placeholder="Scan or type barcode" />
              </FormField>
            </FieldGrid>
            <FormField label="Description">
              <Textarea {...form.register("description")} />
            </FormField>
          </FormSection>

          <FormSection title="Purchasing" description="Optional defaults used when buying this item.">
            <FieldGrid>
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

          <AdvancedSection
            title="Advanced: item code & accounting (optional)"
            description="Leave blank to use company defaults. Internal item code is separate from HS code."
            defaultOpen={hasAccountOverrides || Boolean(item?.itemCode)}
          >
            <FieldGrid>
              <FormField label="Internal item code">
                <Input {...form.register("itemCode")} placeholder="ITEM-001" />
              </FormField>
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
            </FieldGrid>
          </AdvancedSection>

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
              <div className="grid gap-3">
                <FieldGrid>
                  <FormField
                    label="Quantity on hand"
                    helperText={
                      mode === "edit"
                        ? "Read-only after create. Restock with a bill or inventory adjustment so FIFO cost batches stay accurate."
                        : "Sets opening stock and creates an OPENING cost batch. Later restock via bill or adjustment."
                    }
                  >
                    <Input
                      type="number"
                      step="0.01"
                      disabled={mode === "edit"}
                      readOnly={mode === "edit"}
                      {...form.register("quantityOnHand")}
                    />
                  </FormField>
                  <FormField label="Reorder level">
                    <Input type="number" step="0.01" {...form.register("reorderLevel")} />
                  </FormField>
                </FieldGrid>
                {mode === "edit" && companyId ? (
                  <p className="text-xs text-muted-foreground">
                    Restock:{" "}
                    <Link
                      className="font-medium text-foreground underline underline-offset-2"
                      to={`/app/company/${companyId}/inventory/adjustments/new`}
                    >
                      Inventory adjustment (Increase)
                    </Link>
                    {" · "}
                    <Link
                      className="font-medium text-foreground underline underline-offset-2"
                      to={`/app/company/${companyId}/bills/new`}
                    >
                      Vendor bill
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
          </FormSection>
        </form>
      </CreateEditDrawer>

      {hsModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-sm"
            onClick={createHsCodeMutation.isPending ? undefined : () => setHsModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4">
            <div className={cn("surface space-y-4 p-6")}>
              <div>
                <h3 className="text-lg font-semibold">Add new HS code</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  HS codes are shared by category. Only the code is saved on the item.
                </p>
              </div>
              {hsModalError ? <Alert title={hsModalError} variant="destructive" /> : null}
              {createHsCodeMutation.error ? (
                <Alert title={createHsCodeMutation.error.message} variant="destructive" />
              ) : null}
              <FormField label="HS code">
                <Input
                  onChange={(event) => setNewHsCode(event.target.value)}
                  placeholder="01111111"
                  value={newHsCode}
                />
              </FormField>
              <FormField label="Category name">
                <Input
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Paper"
                  value={newCategoryName}
                />
              </FormField>
              <div className="flex justify-end gap-3">
                <Button
                  disabled={createHsCodeMutation.isPending}
                  onClick={() => setHsModalOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  isLoading={createHsCodeMutation.isPending}
                  onClick={handleCreateHsCode}
                  type="button"
                >
                  Save HS code
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {unitModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-sm"
            onClick={createUnitMutation.isPending ? undefined : () => setUnitModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4">
            <div className={cn("surface space-y-4 p-6")}>
              <div>
                <h3 className="text-lg font-semibold">Add new unit</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  New units are shared across all businesses.
                </p>
              </div>
              {unitModalError ? <Alert title={unitModalError} variant="destructive" /> : null}
              {createUnitMutation.error ? (
                <Alert title={createUnitMutation.error.message} variant="destructive" />
              ) : null}
              <FormField label="Unit code">
                <Input
                  onChange={(event) => setNewUnitCode(event.target.value)}
                  placeholder="pcs"
                  value={newUnitCode}
                />
              </FormField>
              <FormField label="Unit name">
                <Input
                  onChange={(event) => setNewUnitName(event.target.value)}
                  placeholder="Pieces"
                  value={newUnitName}
                />
              </FormField>
              <FormField label="Group (optional)">
                <Input
                  onChange={(event) => setNewUnitGroup(event.target.value)}
                  placeholder="Count"
                  value={newUnitGroup}
                />
              </FormField>
              <div className="flex justify-end gap-3">
                <Button
                  disabled={createUnitMutation.isPending}
                  onClick={() => setUnitModalOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  isLoading={createUnitMutation.isPending}
                  onClick={handleCreateUnit}
                  type="button"
                >
                  Save unit
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
