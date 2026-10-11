import { useMemo, useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { TableActions } from "@/components/shared/table-actions";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { ItemFormDrawer } from "@/features/items/components/item-form-drawer";
import { ItemsModuleNav } from "@/features/items/components/items-module-nav";
import { useHsCodeCategories } from "@/features/items/hooks/use-hs-code-categories";
import { useItemCategories } from "@/features/items/hooks/use-item-categories";
import {
  useCreateItemRateCalculator,
  useDeleteItemRateCalculator,
  useItemRateCalculators,
  useUpdateItemRateCalculator,
} from "@/features/items/hooks/use-item-rate-calculators";
import { useCreateItem } from "@/features/items/hooks/use-items";
import type { ItemFormValues } from "@/features/items/schemas/item.schema";
import type {
  ItemRateCalculator,
  RateCalculatorFieldDef,
} from "@/features/items/types/item-rate-calculator.types";
import {
  evaluateRateFormula,
  formatCalculatedRate,
  slugifyFieldKey,
  validateFormulaAgainstFields,
} from "@/features/items/utils/rate-calculator-formula";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useTaxRates } from "@/features/tax/hooks/use-tax";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatDate } from "@/lib/utils/format";

const emptyField = (): RateCalculatorFieldDef => ({ key: "", label: "" });

export function ItemRateCalculatorsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "items");
  const canManage = canManageEntity(permissions, "items");
  const listQuery = useItemRateCalculators(companyId);
  const createMutation = useCreateItemRateCalculator(companyId);
  const deleteMutation = useDeleteItemRateCalculator(companyId);
  const [selected, setSelected] = useState<ItemRateCalculator | null>(null);
  const updateMutation = useUpdateItemRateCalculator(companyId, selected?.id ?? null);

  const [builderMode, setBuilderMode] = useState<"create" | "edit">("create");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<RateCalculatorFieldDef[]>([
    { key: "rawMaterial", label: "Raw material cost" },
  ]);
  const [formula, setFormula] = useState("rawMaterial");
  const [builderError, setBuilderError] = useState<string | null>(null);

  const [useTarget, setUseTarget] = useState<ItemRateCalculator | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calculatedRate, setCalculatedRate] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ItemRateCalculator | null>(null);

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [salesPricePrefill, setSalesPricePrefill] = useState<string | undefined>(undefined);
  const createItemMutation = useCreateItem(companyId);
  const accountsQuery = useAccountOptions(companyId);
  const vendorsQuery = useVendorOptions(companyId);
  const taxRatesQuery = useTaxRates(companyId);
  const hsCodeCategoriesQuery = useHsCodeCategories(companyId);
  const itemCategoriesQuery = useItemCategories(companyId);

  const activeMutation = builderMode === "create" ? createMutation : updateMutation;

  const useCalcPreview = useMemo(() => {
    if (!useTarget) return null;
    const keys = useTarget.definition.fields.map((f) => f.key);
    return evaluateRateFormula(useTarget.definition.formula, fieldValues, keys);
  }, [fieldValues, useTarget]);

  if (!canView) {
    return (
      <ErrorState
        title="Items access restricted"
        description="Your current company membership does not include item visibility."
      />
    );
  }

  const resetBuilder = () => {
    setName("");
    setFields([{ key: "rawMaterial", label: "Raw material cost" }]);
    setFormula("rawMaterial");
    setBuilderError(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const openCreate = () => {
    setSelected(null);
    setBuilderMode("create");
    resetBuilder();
    setBuilderOpen(true);
  };

  const openEdit = (row: ItemRateCalculator) => {
    setSelected(row);
    setBuilderMode("edit");
    setName(row.name);
    setFields(
      row.definition.fields.length
        ? row.definition.fields.map((f) => ({ ...f }))
        : [emptyField()],
    );
    setFormula(row.definition.formula || "");
    setBuilderError(null);
    createMutation.reset();
    updateMutation.reset();
    setBuilderOpen(true);
  };

  const openUse = (row: ItemRateCalculator) => {
    setUseTarget(row);
    const initial: Record<string, string> = {};
    for (const f of row.definition.fields) initial[f.key] = "";
    setFieldValues(initial);
    setCalcError(null);
    setCalculatedRate(null);
  };

  const syncFieldKeysFromLabels = (nextFields: RateCalculatorFieldDef[]) => {
    const used = new Set<string>();
    return nextFields.map((f) => {
      const label = f.label.trim();
      if (!label) return { ...f, key: f.key || "" };
      if (f.key && !used.has(f.key)) {
        used.add(f.key);
        return f;
      }
      const key = slugifyFieldKey(label, used);
      used.add(key);
      return { ...f, key };
    });
  };

  const saveBuilder = async () => {
    setBuilderError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setBuilderError("Name is required");
      return;
    }
    const normalized = syncFieldKeysFromLabels(fields)
      .map((f) => ({ key: f.key.trim(), label: f.label.trim() }))
      .filter((f) => f.key && f.label);
    if (!normalized.length) {
      setBuilderError("Add at least one field with a label");
      return;
    }
    const keys = normalized.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      setBuilderError("Field keys must be unique");
      return;
    }
    const formulaError = validateFormulaAgainstFields(formula, keys);
    if (formulaError) {
      setBuilderError(formulaError);
      return;
    }
    const payload = {
      name: trimmedName,
      definition: { fields: normalized, formula: formula.trim() },
    };
    try {
      if (builderMode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (selected) {
        await updateMutation.mutateAsync(payload);
      }
      setBuilderOpen(false);
    } catch (error) {
      setBuilderError(getApiErrorMessage(error));
    }
  };

  const runCalculate = () => {
    if (!useTarget) return;
    const keys = useTarget.definition.fields.map((f) => f.key);
    const result = evaluateRateFormula(useTarget.definition.formula, fieldValues, keys);
    if (!result.ok) {
      setCalcError(result.error);
      setCalculatedRate(null);
      return;
    }
    setCalcError(null);
    setCalculatedRate(formatCalculatedRate(result.value));
  };

  const proceedToCreateItem = () => {
    const rate =
      calculatedRate ??
      (useCalcPreview?.ok ? formatCalculatedRate(useCalcPreview.value) : null);
    if (!rate) {
      setCalcError("Calculate a valid rate first");
      return;
    }
    setSalesPricePrefill(rate);
    setItemDrawerOpen(true);
  };

  const columns: DataTableColumn<ItemRateCalculator>[] = [
    {
      key: "name",
      header: "Calculator",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.definition.fields.length} field
            {row.definition.fields.length === 1 ? "" : "s"} · {row.definition.formula}
          </p>
        </div>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      className: "w-[140px]",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[220px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => openUse(row)} size="sm" type="button" variant="secondary">
            <Calculator className="mr-1 h-3.5 w-3.5" />
            Use
          </Button>
          <TableActions
            canManage={canManage}
            onDelete={() => setDeleteTarget(row)}
            onEdit={() => openEdit(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <EntityListPage
        content={
          listQuery.error ? (
            <ErrorState
              title="Unable to load rate calculators"
              description={listQuery.error.message}
            />
          ) : (
            <DataTable
              columns={columns}
              data={listQuery.data ?? []}
              emptyDescription="Build independent formulas (raw material, printing, cutting, …) then calculate a sale price and create an item."
              emptyTitle="No rate calculators yet"
              getRowKey={(row) => row.id}
              isLoading={listQuery.isLoading}
            />
          )
        }
        description="Product-independent calculators. Enter costs, apply your formula, then proceed to create an item with the rate as sale price."
        eyebrow="Items"
        headerActions={
          <Button disabled={!canManage} onClick={openCreate} type="button">
            <Plus className="mr-2 h-4 w-4" />
            New calculator
          </Button>
        }
        title="Rate calculators"
        toolbar={<ItemsModuleNav />}
      />

      <CreateEditDrawer
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setBuilderOpen(false);
                activeMutation.reset();
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={!canManage}
              isLoading={activeMutation.isPending}
              onClick={() => void saveBuilder()}
              type="button"
            >
              {builderMode === "create" ? "Create" : "Save changes"}
            </Button>
          </div>
        }
        onClose={() => {
          setBuilderOpen(false);
          activeMutation.reset();
        }}
        open={builderOpen}
        title={builderMode === "create" ? "New rate calculator" : "Edit rate calculator"}
      >
        <div className="space-y-4">
          {(builderError || activeMutation.error) && (
            <Alert
              title={builderError ?? getApiErrorMessage(activeMutation.error)}
              variant="destructive"
            />
          )}
          <FormField label="Name">
            <Input
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Poly bag estimate"
              value={name}
            />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Fields</p>
              <Button
                onClick={() => setFields((prev) => [...prev, emptyField()])}
                size="sm"
                type="button"
                variant="secondary"
              >
                Add field
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Label is what you see; key is used in the formula (auto from label if empty).
            </p>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div className="flex items-start gap-2" key={`field-${index}`}>
                  <div className="min-w-0 flex-1">
                    <FormField label={index === 0 ? "Label" : " "}>
                      <Input
                        onChange={(e) => {
                          const label = e.target.value;
                          setFields((prev) => {
                            const next = prev.map((f, i) =>
                              i === index ? { ...f, label } : f,
                            );
                            return syncFieldKeysFromLabels(next);
                          });
                        }}
                        placeholder="Raw material cost"
                        value={field.label}
                      />
                    </FormField>
                  </div>
                  <div className="w-[140px] shrink-0">
                    <FormField label={index === 0 ? "Key" : " "}>
                      <Input
                        onChange={(e) => {
                          const key = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                          setFields((prev) =>
                            prev.map((f, i) => (i === index ? { ...f, key } : f)),
                          );
                        }}
                        placeholder="rawMaterial"
                        value={field.key}
                      />
                    </FormField>
                  </div>
                  <Button
                    className={index === 0 ? "mt-6" : "mt-0"}
                    disabled={fields.length <= 1}
                    onClick={() =>
                      setFields((prev) => prev.filter((_, i) => i !== index))
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <FormField
            helperText="Use field keys with + − × ÷ and parentheses. Example: (rawMaterial + printing) / bagCount"
            label="Formula"
          >
            <Input
              onChange={(e) => setFormula(e.target.value)}
              placeholder="(rawMaterial + machinePrep + printing + cutting) / bagCount"
              value={formula}
            />
          </FormField>
          {fields.some((f) => f.key) ? (
            <p className="text-xs text-muted-foreground">
              Keys: {fields.filter((f) => f.key).map((f) => f.key).join(", ")}
            </p>
          ) : null}
        </div>
      </CreateEditDrawer>

      <CreateEditDrawer
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={() => {
                setUseTarget(null);
                setCalculatedRate(null);
                setCalcError(null);
              }}
              type="button"
              variant="ghost"
            >
              Close
            </Button>
            <Button onClick={runCalculate} type="button" variant="secondary">
              Calculate
            </Button>
            <Button
              disabled={!calculatedRate && !(useCalcPreview?.ok)}
              onClick={proceedToCreateItem}
              type="button"
            >
              Proceed to create item
            </Button>
          </div>
        }
        onClose={() => {
          setUseTarget(null);
          setCalculatedRate(null);
          setCalcError(null);
        }}
        open={Boolean(useTarget)}
        title={useTarget ? `Use: ${useTarget.name}` : "Use calculator"}
      >
        {useTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formula: <code className="text-xs">{useTarget.definition.formula}</code>
            </p>
            {calcError ? <Alert title={calcError} variant="destructive" /> : null}
            {useTarget.definition.fields.map((field) => (
              <FormField key={field.key} label={field.label}>
                <Input
                  inputMode="decimal"
                  onChange={(e) => {
                    setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                    setCalculatedRate(null);
                  }}
                  placeholder="0"
                  value={fieldValues[field.key] ?? ""}
                />
              </FormField>
            ))}
            <div className="rounded-xl border border-border/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Estimated rate
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {calculatedRate ??
                  (useCalcPreview?.ok
                    ? formatCalculatedRate(useCalcPreview.value)
                    : "—")}
              </p>
              {!calculatedRate && useCalcPreview && !useCalcPreview.ok ? (
                <p className="mt-1 text-xs text-muted-foreground">{useCalcPreview.error}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </CreateEditDrawer>

      <ItemFormDrawer
        accounts={accountsQuery.data ?? []}
        baseCurrencyCode={getCompanyBaseCurrency(company)}
        createPrefill={salesPricePrefill ? { salesPrice: salesPricePrefill } : undefined}
        error={createItemMutation.error}
        hsCodeCategories={hsCodeCategoriesQuery.data ?? []}
        itemCategories={itemCategoriesQuery.data ?? []}
        isPending={createItemMutation.isPending}
        item={null}
        mode="create"
        onClose={() => {
          setItemDrawerOpen(false);
          setSalesPricePrefill(undefined);
          createItemMutation.reset();
        }}
        onSubmit={async (values: ItemFormValues) => {
          const payload = {
            ...values,
            itemCode: values.itemCode || undefined,
            description: values.description || undefined,
            sku: values.sku || undefined,
            barcode: values.barcode?.trim() || null,
            unitName: values.unitName || "ea",
            itemCategoryId: values.itemCategoryId || null,
            hsCodeCategoryId: values.hsCodeCategoryId || null,
            fbrUom: values.fbrUom || null,
            fbrSaleType: values.fbrSaleType || null,
            fbrSroScheduleNo: values.fbrSroScheduleNo || null,
            fbrSroItemSerialNo: values.fbrSroItemSerialNo || null,
            fbrFixedNotifiedValueOrRetailPrice: values.fbrFixedNotifiedValueOrRetailPrice?.trim()
              ? values.fbrFixedNotifiedValueOrRetailPrice.trim()
              : null,
            fbrQtyPerSellingUnit: values.fbrQtyPerSellingUnit?.trim()
              ? values.fbrQtyPerSellingUnit.trim()
              : null,
            salesPrice: values.salesPrice || "0",
            purchaseCost: values.purchaseCost || "0",
            incomeAccountId: values.incomeAccountId || undefined,
            expenseAccountId: values.expenseAccountId || undefined,
            assetAccountId: values.assetAccountId || undefined,
            preferredVendorId: values.preferredVendorId || undefined,
            taxRateId: values.taxRateId,
            taxable: values.taxable || Boolean(values.taxRateId),
            reorderLevel: values.reorderLevel || undefined,
            quantityOnHand: values.quantityOnHand || undefined,
          };
          await createItemMutation.mutateAsync(payload);
          setItemDrawerOpen(false);
          setSalesPricePrefill(undefined);
          setUseTarget(null);
        }}
        open={itemDrawerOpen}
        taxRates={taxRatesQuery.data ?? []}
        vendors={vendorsQuery.data ?? []}
      />

      <ConfirmDeleteDialog
        description={`Delete calculator “${deleteTarget?.name ?? ""}”? This does not affect existing items.`}
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        open={Boolean(deleteTarget)}
        title="Delete rate calculator"
      />
    </>
  );
}
