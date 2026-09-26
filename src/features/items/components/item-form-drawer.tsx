import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  buildItemSchema,
  type ItemFormInput,
  type ItemFormValues,
} from "@/features/items/schemas/item.schema";
import type { Item } from "@/features/items/types/item.types";
import type { HsCodeCategory } from "@/features/items/types/hs-code-category.types";
import type { Account } from "@/features/accounts/types/account.types";
import type { Vendor } from "@/features/vendors/types/vendor.types";
import type { TaxRate } from "@/features/tax/types/tax.types";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  canShowFbrSettings,
  canUseFbrDigitalInvoicing,
} from "@/features/compliance/utils/compliance-access";
import { useCreateHsCodeCategory } from "@/features/items/hooks/use-hs-code-categories";
import { useNextItemSku } from "@/features/items/hooks/use-items";
import {
  useCreateUnitOfMeasure,
  useUnitsOfMeasure,
} from "@/features/items/hooks/use-units-of-measure";
import {
  useAdoptFbrHsCode,
  useFbrHsUoms,
  useFbrRefHsCodes,
  useFbrRefSaleTypes,
  useFbrRefUoms,
  useFbrSaleTypeRates,
  useFbrSroItems,
  useFbrSroSchedules,
} from "@/features/settings/hooks/use-fbr-reference";
import { cn } from "@/lib/utils/cn";

const ADD_NEW_HS_CODE = "__add_new_hs_code__";
const ADD_NEW_UNIT = "__add_new_unit__";
const PICK_FBR_HS = "__pick_fbr_hs__";

type ItemCreateType = "inventory" | "non_inventory" | "service";

interface ItemFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  item?: Item | null;
  /** Used when mode is create and no item is provided. */
  defaultType?: ItemCreateType;
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
  defaultType = "inventory",
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
  const { companyId, company } = useActiveCompany();
  const showFbrFields = canShowFbrSettings(company);
  const requireFbrDi = canUseFbrDigitalInvoicing(company);
  const companyDefaultSaleType = company?.fbrConfig?.defaultSaleType?.trim() || "";
  const nextSkuQuery = useNextItemSku(companyId, open && mode === "create");
  const unitsQuery = useUnitsOfMeasure(open);
  const createHsCodeMutation = useCreateHsCodeCategory(companyId);
  const createUnitMutation = useCreateUnitOfMeasure();
  const adoptHsMutation = useAdoptFbrHsCode(companyId);
  const uomsQuery = useFbrRefUoms(companyId, open && showFbrFields);
  const saleTypesQuery = useFbrRefSaleTypes(companyId, open && showFbrFields);

  const [hsModalOpen, setHsModalOpen] = useState(false);
  const [newHsCode, setNewHsCode] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [hsModalError, setHsModalError] = useState<string | null>(null);

  const [fbrHsPickerOpen, setFbrHsPickerOpen] = useState(false);
  const [fbrHsQuery, setFbrHsQuery] = useState("");
  const [fbrHsError, setFbrHsError] = useState<string | null>(null);
  const [adoptedHsCode, setAdoptedHsCode] = useState("");
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);
  const [selectedSroId, setSelectedSroId] = useState<number | null>(null);
  const deferredHsQuery = useDeferredValue(fbrHsQuery.trim());
  const fbrHsCodesQuery = useFbrRefHsCodes(
    companyId,
    deferredHsQuery,
    open && showFbrFields && (fbrHsPickerOpen || deferredHsQuery.length >= 2),
  );
  const hsUomsQuery = useFbrHsUoms(
    companyId,
    adoptedHsCode,
    undefined,
    open && showFbrFields && Boolean(adoptedHsCode),
  );

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitGroup, setNewUnitGroup] = useState("");
  const [unitModalError, setUnitModalError] = useState<string | null>(null);

  const units = unitsQuery.data ?? [];

  const form = useForm<ItemFormInput, undefined, ItemFormValues>({
    resolver: zodResolver(buildItemSchema(requireFbrDi, false)),
    mode: "onSubmit",
    defaultValues: {
      itemCode: "",
      name: "",
      description: "",
      type: "inventory",
      sku: "",
      barcode: "",
      unitName: "ea",
      hsCodeCategoryId: "",
      fbrUom: "",
      fbrSaleType: "",
      fbrSroScheduleNo: "",
      fbrSroItemSerialNo: "",
      fbrFixedNotifiedValueOrRetailPrice: "",
      fbrQtyPerSellingUnit: "",
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
  const selectedHsCodeCategoryId = form.watch("hsCodeCategoryId");
  const itemName = form.watch("name");
  const selectedUnit = form.watch("unitName");
  const fbrSaleType = form.watch("fbrSaleType") ?? "";
  const fbrSroScheduleNo = form.watch("fbrSroScheduleNo") ?? "";

  const selectedTaxRate = useMemo(
    () => taxRates.find((rate) => rate.id === taxRateId) ?? null,
    [taxRateId, taxRates],
  );
  const taxRatePercentLabel = useMemo(() => {
    if (!selectedTaxRate) return "";
    const raw = String(selectedTaxRate.ratePercent ?? "").trim();
    if (!raw) return "";
    if (raw.includes("%")) return raw;
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    return `${Number.isInteger(n) ? String(n) : String(n)}%`;
  }, [selectedTaxRate]);
  const taxForcesSro = useMemo(() => {
    if (!taxRatePercentLabel) return false;
    const normalized = taxRatePercentLabel.replace(/%/g, "").trim();
    const n = Number(normalized);
    if (!Number.isFinite(n)) return true;
    return Math.abs(n - 18) >= 1e-9;
  }, [taxRatePercentLabel]);

  const saleTypeRatesQuery = useFbrSaleTypeRates(
    companyId,
    fbrSaleType,
    taxRatePercentLabel || undefined,
    open && requireFbrDi && Boolean(fbrSaleType.trim()),
  );

  const selectedRateDescription = useMemo(() => {
    const rates = saleTypeRatesQuery.data?.items ?? [];
    const match = rates.find((r) => r.rateId === selectedRateId);
    return match?.rateDescription || taxRatePercentLabel || "";
  }, [saleTypeRatesQuery.data?.items, selectedRateId, taxRatePercentLabel]);

  const sroSchedulesQuery = useFbrSroSchedules(
    companyId,
    selectedRateId,
    selectedRateDescription || taxRatePercentLabel,
    open && requireFbrDi && selectedRateId != null,
  );
  const sroItemsQuery = useFbrSroItems(
    companyId,
    selectedSroId,
    open && requireFbrDi && selectedSroId != null,
  );

  const sroRequired =
    requireFbrDi &&
    Boolean(
      taxForcesSro ||
        sroSchedulesQuery.data?.required ||
        sroSchedulesQuery.data?.applicable ||
        sroSchedulesQuery.data?.rateForcesSro ||
        (sroSchedulesQuery.data?.items?.length ?? 0) > 0 ||
        saleTypeRatesQuery.data?.scenarioRequirement?.sroRequired,
    );

  const retailPriceRequired =
    requireFbrDi && fbrSaleType.trim().toLowerCase() === "3rd schedule goods";

  const selectedUnitName = form.watch("unitName") ?? "";
  const selectedFbrUom = form.watch("fbrUom") ?? "";
  const qtyFactorRequired =
    requireFbrDi &&
    Boolean(selectedUnitName.trim()) &&
    Boolean(selectedFbrUom.trim()) &&
    selectedUnitName.trim().toLowerCase() !== selectedFbrUom.trim().toLowerCase();

  const schema = useMemo(
    () => buildItemSchema(requireFbrDi, sroRequired, retailPriceRequired, qtyFactorRequired),
    [requireFbrDi, sroRequired, retailPriceRequired, qtyFactorRequired],
  );

  useEffect(() => {
    form.clearErrors(["fbrSroScheduleNo", "fbrSroItemSerialNo"]);
  }, [form, sroRequired]);

  useEffect(() => {
    form.clearErrors(["fbrFixedNotifiedValueOrRetailPrice"]);
    if (!retailPriceRequired) {
      form.setValue("fbrFixedNotifiedValueOrRetailPrice", "");
    }
  }, [form, retailPriceRequired]);

  useEffect(() => {
    form.clearErrors(["fbrQtyPerSellingUnit"]);
    if (!qtyFactorRequired) {
      form.setValue("fbrQtyPerSellingUnit", "");
    }
  }, [form, qtyFactorRequired]);

  const hasAccountOverrides = Boolean(
    item?.incomeAccountId || item?.expenseAccountId || item?.assetAccountId,
  );
  const deferredItemName = useDeferredValue(itemName?.trim() ?? "");

  useEffect(() => {
    if (!open) return;
    const createType = mode === "create" ? defaultType : "inventory";
    const resolvedType = item?.type ?? createType;
    const defaultSale =
      mode === "create" && requireFbrDi
        ? companyDefaultSaleType || "Goods at standard rate (default)"
        : "";
    form.reset({
      itemCode: item?.itemCode ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      type: resolvedType,
      sku: item?.sku ?? "",
      barcode: item?.barcode ?? "",
      unitName: item?.unitName ?? "ea",
      hsCodeCategoryId: item?.hsCodeCategoryId ?? "",
      fbrUom: item?.fbrUom ?? "",
      fbrSaleType: item?.fbrSaleType ?? defaultSale,
      fbrSroScheduleNo: item?.fbrSroScheduleNo ?? "",
      fbrSroItemSerialNo: item?.fbrSroItemSerialNo ?? "",
      fbrFixedNotifiedValueOrRetailPrice: item?.fbrFixedNotifiedValueOrRetailPrice ?? "",
      fbrQtyPerSellingUnit: item?.fbrQtyPerSellingUnit ?? "",
      salesPrice: item?.salesPrice ?? "0",
      purchaseCost: item?.purchaseCost ?? "0",
      incomeAccountId: item?.incomeAccountId ?? "",
      expenseAccountId: item?.expenseAccountId ?? "",
      assetAccountId: item?.assetAccountId ?? "",
      preferredVendorId: item?.preferredVendorId ?? "",
      taxable: item?.taxable ?? true,
      taxRateId: item?.taxRateId ?? "",
      trackQuantity: item?.trackQuantity ?? resolvedType !== "service",
      quantityOnHand: item?.quantityOnHand ?? undefined,
      reorderLevel: item?.reorderLevel ?? undefined,
      isActive: item?.isActive ?? true,
    });
    setHsModalOpen(false);
    setUnitModalOpen(false);
    setHsModalError(null);
    setUnitModalError(null);
    setFbrHsPickerOpen(false);
    setFbrHsQuery("");
    setFbrHsError(null);
    setAdoptedHsCode(item?.hsCode?.trim() ?? "");
    setSelectedRateId(null);
    setSelectedSroId(null);
  }, [companyDefaultSaleType, defaultType, form, item, mode, open, requireFbrDi]);

  useEffect(() => {
    if (!open || !requireFbrDi) return;
    const rates = saleTypeRatesQuery.data?.items ?? [];
    if (!rates.length) {
      setSelectedRateId(null);
      return;
    }
    const preferredId = saleTypeRatesQuery.data?.preferredRateId ?? null;
    const taxNeedle = taxRatePercentLabel.replace(/%/g, "").trim();
    const matchedByTax = taxNeedle
      ? rates.find((r) => {
          const desc = (r.rateDescription || "").replace(/%/g, "").trim();
          return desc === taxNeedle || desc.startsWith(taxNeedle) || desc.includes(taxNeedle);
        })
      : undefined;
    const withSchedules = rates.find((r) => (r.scheduleCount ?? 0) > 0);
    const preferred =
      (preferredId != null ? rates.find((r) => r.rateId === preferredId) : undefined) ||
      (matchedByTax && (matchedByTax.scheduleCount ?? 1) > 0 ? matchedByTax : undefined) ||
      withSchedules ||
      matchedByTax ||
      rates[0];
    setSelectedRateId((current) => {
      if (current != null && rates.some((r) => r.rateId === current)) {
        const currentRow = rates.find((r) => r.rateId === current);
        // Keep selection if it already has schedules, or SRO is not forced by tax.
        if ((currentRow?.scheduleCount ?? 0) > 0) return current;
        if (!taxForcesSro) return current;
      }
      return preferred.rateId;
    });
  }, [
    open,
    requireFbrDi,
    saleTypeRatesQuery.data?.items,
    saleTypeRatesQuery.data?.preferredRateId,
    fbrSaleType,
    taxRatePercentLabel,
    taxForcesSro,
  ]);

  useEffect(() => {
    if (!open || !requireFbrDi) return;
    const schedules = sroSchedulesQuery.data?.items ?? [];
    if (!schedules.length) {
      setSelectedSroId(null);
      return;
    }
    const currentDesc = form.getValues("fbrSroScheduleNo")?.trim();
    const match = schedules.find((s) => s.description === currentDesc);
    const next = match ?? schedules[0];
    setSelectedSroId(next.sroId);
    if (!match) {
      form.setValue("fbrSroScheduleNo", next.description, { shouldValidate: true });
    }
  }, [form, open, requireFbrDi, sroSchedulesQuery.data?.items]);

  useEffect(() => {
    if (!open || !requireFbrDi) return;
    const items = sroItemsQuery.data?.items ?? [];
    if (!items.length) return;
    const current = form.getValues("fbrSroItemSerialNo")?.trim();
    const stillValid = items.some((i) => i.serialNo === current);
    if (!current || !stillValid) {
      form.setValue("fbrSroItemSerialNo", items[0].serialNo, { shouldValidate: true });
    }
  }, [form, open, requireFbrDi, sroItemsQuery.data?.items, selectedSroId]);

  useEffect(() => {
    if (!open || !showFbrFields || fbrHsPickerOpen) return;
    if (deferredItemName.length >= 2) {
      setFbrHsQuery(deferredItemName);
    }
  }, [deferredItemName, fbrHsPickerOpen, open, showFbrFields]);

  useEffect(() => {
    if (!open || !showFbrFields || !adoptedHsCode) return;
    const suggested = hsUomsQuery.data?.items ?? [];
    if (!suggested.length) return;
    const current = form.getValues("fbrUom")?.trim();
    const stillValid = suggested.some((u) => u.description === current);
    if (!current || !stillValid) {
      form.setValue("fbrUom", suggested[0].description, { shouldValidate: true });
    }
  }, [adoptedHsCode, form, hsUomsQuery.data?.items, open, showFbrFields]);

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
    if (value === PICK_FBR_HS) {
      setFbrHsPickerOpen(true);
      setFbrHsError(null);
      setFbrHsQuery(form.getValues("name")?.trim() || "");
      return;
    }
    if (value === ADD_NEW_HS_CODE) {
      setHsModalOpen(true);
      setHsModalError(null);
      return;
    }
    form.setValue("hsCodeCategoryId", value, { shouldValidate: true });
    const matched = hsCodeCategories.find((category) => category.id === value);
    setAdoptedHsCode(matched?.code?.trim() ?? "");
  };

  const handleAdoptFbrHs = async (hsCode: string, description: string) => {
    setFbrHsError(null);
    try {
      const adopted = await adoptHsMutation.mutateAsync({
        hsCode,
        description,
      });
      form.setValue("hsCodeCategoryId", adopted.hsCodeCategoryId, { shouldValidate: true });
      setAdoptedHsCode(adopted.hsCode);
      setFbrHsPickerOpen(false);
      setFbrHsQuery("");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to adopt FBR HS code";
      setFbrHsError(message);
    }
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
      form.setValue("hsCodeCategoryId", created.id, { shouldValidate: true });
      setAdoptedHsCode(created.code?.trim() || code);
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
              onClick={form.handleSubmit(async (values) => {
                const parsed = schema.safeParse(values);
                if (!parsed.success) {
                  for (const issue of parsed.error.issues) {
                    const key = issue.path[0];
                    if (typeof key === "string") {
                      form.setError(key as keyof ItemFormValues, { message: issue.message });
                    }
                  }
                  return;
                }
                const payload = { ...parsed.data };
                if (!sroRequired) {
                  payload.fbrSroScheduleNo = "";
                  payload.fbrSroItemSerialNo = "";
                }
                if (!retailPriceRequired) {
                  payload.fbrFixedNotifiedValueOrRetailPrice = "";
                }
                if (!qtyFactorRequired) {
                  payload.fbrQtyPerSellingUnit = "";
                }
                await onSubmit(payload);
              })}
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
              <FormField
                error={form.formState.errors.name?.message}
                helperText={
                  showFbrFields
                    ? "Type at least 2 characters — matching FBR HS codes appear below (after reference sync)."
                    : undefined
                }
                label="Name"
              >
                <Input {...form.register("name")} placeholder="Paper cup" />
              </FormField>
              {showFbrFields && deferredItemName.length >= 2 && !selectedHsCodeCategoryId ? (
                <div className="md:col-span-2 max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                  <p className="px-1 text-xs text-muted-foreground">
                    FBR HS matches for “{deferredItemName}”
                    {fbrHsCodesQuery.isFetching ? " · searching…" : ""}
                  </p>
                  {(fbrHsCodesQuery.data?.items ?? []).length === 0 && !fbrHsCodesQuery.isFetching ? (
                    <p className="px-1 py-2 text-xs text-muted-foreground">
                      No matches. Refresh FBR lists in Settings, or open “Search FBR HS list…”.
                    </p>
                  ) : (
                    (fbrHsCodesQuery.data?.items ?? []).slice(0, 8).map((row) => (
                      <button
                        className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        disabled={adoptHsMutation.isPending}
                        key={row.id}
                        onClick={() => void handleAdoptFbrHs(row.hsCode, row.description)}
                        type="button"
                      >
                        <span className="font-medium">{row.hsCode}</span>
                        <span className="text-xs text-muted-foreground">{row.description}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
              <FormField
                error={form.formState.errors.hsCodeCategoryId?.message}
                helperText={
                  requireFbrDi
                    ? "Required for FBR Digital Invoicing. Prefer FBR list / name search so the code matches PRAL."
                    : "Optional. Select an existing HS category, search FBR list, or add a new one."
                }
                label={requireFbrDi ? "Item code / HS code" : "Item code / HS code"}
              >
                <Select
                  onChange={(event) => handleHsCodeSelect(event.target.value)}
                  value={selectedHsCodeCategoryId || ""}
                >
                  <option value="">{requireFbrDi ? "Select HS code…" : "No HS code"}</option>
                  {selectedHsCodeCategoryId &&
                  !hsCodeCategories.some((category) => category.id === selectedHsCodeCategoryId) ? (
                    <option value={selectedHsCodeCategoryId}>
                      {item?.hsCode ?? selectedHsCodeCategoryId}
                    </option>
                  ) : null}
                  {hsCodeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {`${category.code}(${category.categoryName})`}
                    </option>
                  ))}
                  {showFbrFields ? (
                    <option value={PICK_FBR_HS}>Search FBR HS list…</option>
                  ) : null}
                  <option value={ADD_NEW_HS_CODE}>Add new HS code…</option>
                </Select>
              </FormField>
              {showFbrFields ? (
                <>
                  <FormField
                    error={form.formState.errors.fbrUom?.message}
                    helperText={
                      adoptedHsCode
                        ? "Preferred: UoMs allowed for this HS (HS_UOM). Fallbacks are full FBR UoM list."
                        : "Exact FBR UoM description for Digital Invoicing (uoM)."
                    }
                    label={requireFbrDi ? "FBR UoM" : "FBR UoM (optional)"}
                  >
                    <Select {...form.register("fbrUom")} value={form.watch("fbrUom") ?? ""}>
                      <option value="">{requireFbrDi ? "Select UoM…" : "Not set"}</option>
                      {(hsUomsQuery.data?.items ?? []).map((uom) => (
                        <option key={`hs-${uom.uomId}`} value={uom.description}>
                          {uom.description} (for HS)
                        </option>
                      ))}
                      {(uomsQuery.data ?? [])
                        .filter(
                          (uom) =>
                            !(hsUomsQuery.data?.items ?? []).some(
                              (hs) => hs.description === uom.description,
                            ),
                        )
                        .map((uom) => (
                          <option key={uom.id} value={uom.description}>
                            {uom.description}
                          </option>
                        ))}
                    </Select>
                  </FormField>
                  {qtyFactorRequired ? (
                    <FormField
                      error={form.formState.errors.fbrQtyPerSellingUnit?.message}
                      helperText={`How many ${selectedFbrUom || "FBR UoM"} equal 1 ${selectedUnitName || "selling unit"}? Example: 1 pc = 0.20 KG → enter 0.20. Invoice keeps selling qty; FBR DI gets qty × this factor.`}
                      label="FBR qty per 1 selling unit"
                    >
                      <Input
                        inputMode="decimal"
                        placeholder="e.g. 0.20"
                        {...form.register("fbrQtyPerSellingUnit")}
                      />
                    </FormField>
                  ) : null}
                  <FormField
                    error={form.formState.errors.fbrSaleType?.message}
                    helperText="Default FBR saleType for invoice lines."
                    label={requireFbrDi ? "FBR sale type" : "FBR sale type (optional)"}
                  >
                    <Select
                      value={form.watch("fbrSaleType") ?? ""}
                      onChange={(event) => {
                        form.setValue("fbrSaleType", event.target.value, { shouldValidate: true });
                        form.setValue("fbrSroScheduleNo", "");
                        form.setValue("fbrSroItemSerialNo", "");
                        if (event.target.value.trim().toLowerCase() !== "3rd schedule goods") {
                          form.setValue("fbrFixedNotifiedValueOrRetailPrice", "");
                        }
                        setSelectedRateId(null);
                        setSelectedSroId(null);
                      }}
                    >
                      <option value="">{requireFbrDi ? "Select sale type…" : "Not set"}</option>
                      {(saleTypesQuery.data ?? []).map((saleType) => (
                        <option key={saleType.id} value={saleType.description}>
                          {saleType.description}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  {retailPriceRequired ? (
                    <FormField
                      error={form.formState.errors.fbrFixedNotifiedValueOrRetailPrice?.message}
                      helperText="Tax-inclusive MRP / notified retail (FBR fixedNotifiedValueOrRetailPrice). Invoice tax is extracted from this amount, not the sell price."
                      label="Fixed / notified / retail price"
                    >
                      <Input
                        inputMode="decimal"
                        placeholder="e.g. 2000"
                        {...form.register("fbrFixedNotifiedValueOrRetailPrice")}
                      />
                    </FormField>
                  ) : null}
                  {requireFbrDi && fbrSaleType.trim() ? (
                    <>
                      {(saleTypeRatesQuery.data?.items?.length ?? 0) > 0 ? (
                        <FormField
                          helperText={
                            taxRatePercentLabel
                              ? `Matched to item tax ${taxRatePercentLabel} when possible. Non-18% rates require SRO (FBR 0077).`
                              : "PDI rate used to load SRO schedules for this sale type."
                          }
                          label="FBR rate (for SRO)"
                        >
                          <Select
                            value={selectedRateId != null ? String(selectedRateId) : ""}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              setSelectedRateId(Number.isFinite(next) ? next : null);
                              form.setValue("fbrSroScheduleNo", "");
                              form.setValue("fbrSroItemSerialNo", "");
                              setSelectedSroId(null);
                            }}
                          >
                            <option value="">Select rate…</option>
                            {(saleTypeRatesQuery.data?.items ?? []).map((rate) => (
                              <option key={rate.rateId} value={rate.rateId}>
                                {rate.rateDescription || rate.rateId}
                                {typeof rate.scheduleCount === "number"
                                  ? ` (${rate.scheduleCount} SRO)`
                                  : ""}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      ) : null}
                      {sroRequired ? (
                        <>
                          <FormField
                            error={form.formState.errors.fbrSroScheduleNo?.message}
                            helperText={
                              sroSchedulesQuery.isError
                                ? "SRO schedules API failed — check FBR token / DI enabled / Network tab."
                                : (sroSchedulesQuery.data?.items?.length ?? 0) === 0
                                  ? "Required for non-18% rate (FBR 0077). PDI returned no schedules for this rate + seller province. Check Settings → FBR seller province, or try another FBR rate."
                                  : "Required when rate is not 18%, PDI returns schedules, or scenario SN024."
                            }
                            label="SRO schedule"
                          >
                            <Select
                              value={fbrSroScheduleNo}
                              onChange={(event) => {
                                const desc = event.target.value;
                                form.setValue("fbrSroScheduleNo", desc, { shouldValidate: true });
                                form.setValue("fbrSroItemSerialNo", "");
                                const match = (sroSchedulesQuery.data?.items ?? []).find(
                                  (s) => s.description === desc,
                                );
                                setSelectedSroId(match?.sroId ?? null);
                              }}
                            >
                              <option value="">Select SRO schedule…</option>
                              {(sroSchedulesQuery.data?.items ?? []).map((schedule) => (
                                <option key={schedule.sroId} value={schedule.description}>
                                  {schedule.description}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                          <FormField
                            error={form.formState.errors.fbrSroItemSerialNo?.message}
                            helperText="SRO item serial number (sroItemSerialNo) from PDI."
                            label="SRO item serial"
                          >
                            <Select
                              {...form.register("fbrSroItemSerialNo")}
                              value={form.watch("fbrSroItemSerialNo") ?? ""}
                            >
                              <option value="">Select SRO item…</option>
                              {(sroItemsQuery.data?.items ?? []).map((sroItem) => (
                                <option
                                  key={`${sroItem.sroItemId}-${sroItem.serialNo}`}
                                  value={sroItem.serialNo}
                                >
                                  {sroItem.serialNo}
                                  {sroItem.description && sroItem.description !== sroItem.serialNo
                                    ? ` — ${sroItem.description}`
                                    : ""}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}
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

      {fbrHsPickerOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-sm"
            onClick={adoptHsMutation.isPending ? undefined : () => setFbrHsPickerOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4">
            <div className={cn("surface space-y-4 p-6")}>
              <div>
                <h3 className="text-lg font-semibold">Search FBR HS codes</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecting a code creates or links a company HS category for this item.
                </p>
              </div>
              {fbrHsError ? <Alert title={fbrHsError} variant="destructive" /> : null}
              <FormField label="Search">
                <Input
                  onChange={(event) => setFbrHsQuery(event.target.value)}
                  placeholder="Type HS code or description…"
                  value={fbrHsQuery}
                />
              </FormField>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                {(fbrHsCodesQuery.data?.items ?? []).length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    {fbrHsCodesQuery.isFetching
                      ? "Searching…"
                      : fbrHsQuery.trim()
                        ? "No matches. Try another query or refresh FBR lists in Settings."
                        : "Type to search the FBR HS master list."}
                  </p>
                ) : (
                  (fbrHsCodesQuery.data?.items ?? []).map((row) => (
                    <button
                      className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      disabled={adoptHsMutation.isPending}
                      key={row.id}
                      onClick={() => void handleAdoptFbrHs(row.hsCode, row.description)}
                      type="button"
                    >
                      <span className="font-medium">{row.hsCode}</span>
                      <span className="text-xs text-muted-foreground">{row.description}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={adoptHsMutation.isPending}
                  onClick={() => setFbrHsPickerOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}

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
