import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { WhtSettingsFields } from "@/features/shared/components/wht-settings-fields";
import { whtHeldByLabel, whtNetLabel, whtSettlementAddsToCash } from "@/features/shared/utils/wht-labels";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { DocumentCurrencyFields } from "@/components/documents/document-currency-fields";
import { DocumentTotalsCard } from "@/components/documents/document-totals-card";
import { LineItemsEditor } from "@/components/documents/line-items-editor";
import { ErrorState } from "@/components/shared/error-state";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { FormValidationSummary } from "@/components/shared/form-validation-summary";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useBill, useCreateBill, useNextBillNumber, useUpdateBill } from "@/features/bills/hooks/use-bills";
import { billSchema, type BillFormInput, type BillFormValues } from "@/features/bills/schemas/bill.schema";
import { ItemFormDrawer } from "@/features/items/components/item-form-drawer";
import { useCreateItem, useItemOptions } from "@/features/items/hooks/use-items";
import { useHsCodeCategories } from "@/features/items/hooks/use-hs-code-categories";
import type { ItemFormValues } from "@/features/items/schemas/item.schema";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { toDocumentLinePreview } from "@/features/shared/utils/api-payload";
import { getDocumentPreviewTotals } from "@/features/shared/utils/document-calculations";
import { previewDualNetSettlement, previewWhtAmount } from "@/features/shared/utils/withholding-tax-preview";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import {
  convertBasePriceToDocumentPrice,
  getCompanyBaseCurrency,
  resolveDocumentExchangeRate,
} from "@/features/companies/utils/company-currency";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import { useTaxCodes, useTaxRates } from "@/features/tax/hooks/use-tax";
import { VendorFormDrawer } from "@/features/vendors/components/vendor-form-drawer";
import { useCreateVendor, useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import type { VendorFormValues } from "@/features/vendors/schemas/vendor.schema";
import { queryClient } from "@/lib/query/query-client";

interface BillFormPageProps {
  mode: "create" | "edit";
}

const DEFAULT_PAYMENT_TERMS_DAYS = 15;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIsoDate(): string {
  return toIsoDate(new Date());
}

function addDaysIso(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function buildCreateDefaults(company: ReturnType<typeof useActiveCompany>["company"]): BillFormInput {
  const issueDate = todayIsoDate();
  return {
    vendorId: "",
    billNumber: "",
    referenceNumber: "",
    issueDate,
    dueDate: addDaysIso(issueDate, DEFAULT_PAYMENT_TERMS_DAYS),
    currencyCode: getCompanyBaseCurrency(company),
    exchangeRate: "",
    notes: "",
    terms: "",
    discountType: undefined,
    discountValue: "",
    whtEnabled: false,
    whtType: "",
    whtRate: "",
    whtBase: "",
    whtHeldBy: "COMPANY",
    incomeWhtEnabled: false,
    incomeWhtRate: "",
    incomeWhtBase: "",
    incomeWhtHeldBy: "COMPANY",
    salesTaxWhtEnabled: false,
    salesTaxWhtRate: "",
    salesTaxWhtBase: "",
    salesTaxWhtHeldBy: "COMPANY",
    lines: [
      {
        itemId: "",
        description: "",
        quantity: "1",
        unitCost: "",
        itemName: "",
        unitName: "",
        discountType: undefined,
        discountValue: "",
        taxCodeId: "",
        taxRate: "",
        expenseAccountId: "",
      },
    ],
  };
}

export function BillFormPage({ mode }: BillFormPageProps) {
  const navigate = useNavigate();
  const { billId, companyId } = useParams();
  const [searchParams] = useSearchParams();
  const { company, permissions } = useActiveCompany();
  const vendorsQuery = useVendorOptions(companyId);
  const itemsQuery = useItemOptions(companyId);
  const accountsQuery = useAccountOptions(companyId);
  const taxCodesQuery = useTaxCodes(companyId);
  const taxRatesQuery = useTaxRates(companyId);
  const hsCodeCategoriesQuery = useHsCodeCategories(companyId);
  const billQuery = useBill(companyId, mode === "edit" ? billId ?? null : null);
  const nextBillNumberQuery = useNextBillNumber(companyId, mode === "create");
  const createMutation = useCreateBill(companyId);
  const updateMutation = useUpdateBill(companyId, billId ?? null);
  const createVendorMutation = useCreateVendor(companyId);
  const createItemMutation = useCreateItem(companyId);
  const canManage = canManageEntity(permissions, "bills");
  const validationSummaryRef = useRef<HTMLDivElement>(null);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [itemCreateLineIndex, setItemCreateLineIndex] = useState<number | null>(null);

  const createDefaults = useMemo(() => buildCreateDefaults(company), [company]);

  const form = useForm<BillFormInput, undefined, BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: createDefaults,
  });

  // Prefill from Buy Stock / low-stock deep link: ?itemId=&qty=
  useEffect(() => {
    if (mode !== "create") return;
    const itemId = searchParams.get("itemId");
    const qty = searchParams.get("qty");
    if (!itemId || !itemsQuery.data?.length) return;

    const item = itemsQuery.data.find((row) => row.id === itemId);
    if (!item) return;

    form.setValue("lines", [
      {
        itemId: item.id,
        description: item.name,
        quantity: qty && Number(qty) > 0 ? String(qty) : "1",
        unitCost: item.purchaseCost != null ? String(item.purchaseCost) : "",
        itemName: item.name,
        unitName: item.unitName ?? "",
        discountType: undefined,
        discountValue: "",
        taxCodeId: "",
        taxRate: "",
        expenseAccountId: item.expenseAccountId ?? item.assetAccountId ?? "",
      },
    ]);
  }, [mode, searchParams, itemsQuery.data, form]);

  useEffect(() => {
    if (mode !== "create" || !nextBillNumberQuery.data) return;
    if (form.getValues("billNumber")) return;
    form.setValue("billNumber", nextBillNumberQuery.data, { shouldDirty: false });
  }, [mode, nextBillNumberQuery.data, form]);

  useEffect(() => {
    if (mode !== "edit" || !billQuery.data) {
      return;
    }

    const bill = billQuery.data;
    form.reset({
      vendorId: bill.vendorId,
      billNumber: bill.billNumber ?? "",
      referenceNumber: bill.referenceNumber ?? "",
      issueDate: bill.issueDate ?? "",
      dueDate: bill.dueDate ?? "",
      currencyCode: bill.currencyCode ?? getCompanyBaseCurrency(company),
      exchangeRate: bill.exchangeRate ?? "",
      notes: bill.notes ?? "",
      terms: "",
      discountType: bill.discountType ?? undefined,
      discountValue:
        bill.discountValue != null && bill.discountValue !== ""
          ? toOptionalDecimalString(bill.discountValue)
          : "",
      whtEnabled: Boolean(bill.whtEnabled),
      whtType: bill.whtType ?? "",
      whtRate: bill.whtRate != null ? toOptionalDecimalString(bill.whtRate) : "",
      whtBase: bill.whtBase ?? "",
      whtHeldBy: bill.whtHeldBy ?? "COMPANY",
      incomeWhtEnabled: Boolean(bill.incomeWhtEnabled ?? (bill.whtEnabled && bill.whtType === "INCOME")),
      incomeWhtRate:
        bill.incomeWhtRate != null
          ? toOptionalDecimalString(bill.incomeWhtRate)
          : bill.whtType === "INCOME" && bill.whtRate != null
            ? toOptionalDecimalString(bill.whtRate)
            : "",
      incomeWhtBase: bill.incomeWhtBase ?? (bill.whtType === "INCOME" ? bill.whtBase ?? "" : ""),
      incomeWhtHeldBy:
        bill.incomeWhtHeldBy ?? bill.whtHeldBy ?? "COMPANY",
      salesTaxWhtEnabled: Boolean(
        bill.salesTaxWhtEnabled ?? (bill.whtEnabled && bill.whtType === "SALES_TAX"),
      ),
      salesTaxWhtRate:
        bill.salesTaxWhtRate != null
          ? toOptionalDecimalString(bill.salesTaxWhtRate)
          : bill.whtType === "SALES_TAX" && bill.whtRate != null
            ? toOptionalDecimalString(bill.whtRate)
            : "",
      salesTaxWhtBase:
        bill.salesTaxWhtBase ?? (bill.whtType === "SALES_TAX" ? bill.whtBase ?? "" : ""),
      salesTaxWhtHeldBy:
        bill.salesTaxWhtHeldBy ?? bill.whtHeldBy ?? "COMPANY",
      lines:
        bill.lines?.map((line) => ({
          itemId: line.itemId ?? "",
          description: line.description,
          quantity: toDecimalString(line.quantity || "1"),
          unitCost: line.unitCost != null ? toOptionalDecimalString(line.unitCost) : "",
          itemName: line.itemName ?? "",
          unitName: "",
          discountType: line.discountType ?? undefined,
          discountValue:
            line.discountValue != null && line.discountValue !== ""
              ? toOptionalDecimalString(line.discountValue)
              : "",
          taxCodeId: line.taxCodeId ?? "",
          taxRate: line.taxRate != null ? toOptionalDecimalString(line.taxRate) : "",
          expenseAccountId: line.expenseAccountId ?? "",
        })) ?? [],
    });
  }, [billQuery.data, company, form, mode]);

  useEffect(() => {
    if (!itemsQuery.data?.length) return;
    const lines = form.getValues("lines") ?? [];
    lines.forEach((line, index) => {
      if (!line.itemId || line.unitName) return;
      const item = itemsQuery.data.find((row) => row.id === line.itemId);
      if (item?.unitName) {
        form.setValue(`lines.${index}.unitName`, item.unitName, { shouldDirty: false });
      }
    });
  }, [itemsQuery.data, form, billQuery.data]);

  const watchedLines = useWatch({ control: form.control, name: "lines" });
  const watchedVendorId = form.watch("vendorId");
  const watchedIssueDate = form.watch("issueDate");
  const watchedCurrencyCode = form.watch("currencyCode");
  const watchedExchangeRate = form.watch("exchangeRate");
  const watchedIncomeWhtEnabled = form.watch("incomeWhtEnabled");
  const watchedIncomeWhtRate = form.watch("incomeWhtRate");
  const watchedIncomeWhtBase = form.watch("incomeWhtBase");
  const watchedIncomeWhtHeldBy = form.watch("incomeWhtHeldBy");
  const watchedSalesTaxWhtEnabled = form.watch("salesTaxWhtEnabled");
  const watchedSalesTaxWhtRate = form.watch("salesTaxWhtRate");
  const watchedSalesTaxWhtBase = form.watch("salesTaxWhtBase");
  const watchedSalesTaxWhtHeldBy = form.watch("salesTaxWhtHeldBy");
  const watchedWhtHeldBy = form.watch("whtHeldBy");
  const watchedDiscountType = form.watch("discountType");
  const watchedDiscountValue = form.watch("discountValue");
  const watchedEitherWht = Boolean(watchedIncomeWhtEnabled || watchedSalesTaxWhtEnabled);

  const getVendorPaymentTermsDays = (vendorId: string) => {
    const vendor = (vendorsQuery.data ?? []).find((row) => row.id === vendorId);
    const days = vendor?.paymentTermsDays;
    if (days == null || Number.isNaN(Number(days))) return DEFAULT_PAYMENT_TERMS_DAYS;
    return Math.max(0, Number(days));
  };

  const applyDueDateFromTerms = (issueDate: string, vendorId: string) => {
    if (!issueDate) return;
    const days = vendorId ? getVendorPaymentTermsDays(vendorId) : DEFAULT_PAYMENT_TERMS_DAYS;
    form.setValue("dueDate", addDaysIso(issueDate, days), { shouldDirty: true, shouldValidate: true });
  };

  useCounterpartyCurrencyDefault({
    form,
    counterpartyId: watchedVendorId,
    counterparties: vendorsQuery.data ?? [],
    company,
    mode,
  });

  // When vendor changes, refresh due date from current issue + vendor terms (create & edit).
  const previousVendorIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!watchedVendorId) {
      previousVendorIdRef.current = watchedVendorId;
      return;
    }
    if (previousVendorIdRef.current === watchedVendorId) return;
    const isInitialEditHydration =
      mode === "edit" && previousVendorIdRef.current === undefined && Boolean(billQuery.data);
    previousVendorIdRef.current = watchedVendorId;
    if (isInitialEditHydration) return;
    const issueDate = form.getValues("issueDate") || todayIsoDate();
    if (!form.getValues("issueDate")) {
      form.setValue("issueDate", issueDate, { shouldDirty: true });
    }
    applyDueDateFromTerms(issueDate, watchedVendorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on vendorId
  }, [watchedVendorId, mode, billQuery.data]);

  const previousIssueDateRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!watchedIssueDate) {
      previousIssueDateRef.current = watchedIssueDate;
      return;
    }
    if (previousIssueDateRef.current === watchedIssueDate) return;
    const isInitialEditHydration =
      mode === "edit" && previousIssueDateRef.current === undefined && Boolean(billQuery.data);
    previousIssueDateRef.current = watchedIssueDate;
    if (isInitialEditHydration) return;
    if (!watchedVendorId) return;
    applyDueDateFromTerms(watchedIssueDate, watchedVendorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on issueDate
  }, [watchedIssueDate, watchedVendorId, mode, billQuery.data]);

  const purchaseTaxCodeOptions = useMemo(() => {
    const options = (taxCodesQuery.data ?? [])
      .filter(
        (taxCode) =>
          !taxCode.scope ||
          taxCode.scope === "PURCHASE" ||
          taxCode.scope === "BOTH",
      )
      .map((taxCode) => ({
        id: taxCode.id,
        name: taxCode.name,
        code: taxCode.code,
        calculationMode: taxCode.calculationMode,
        isExempt: taxCode.isExempt || taxCode.calculationMode === "EXEMPT",
        effectiveRatePercent:
          taxCode.rates?.reduce(
            (sum, rateLink) => sum + Number(rateLink.taxRate?.ratePercent ?? 0),
            0,
          ) ?? 0,
      }));

    return options.sort((a, b) => {
      if (a.isExempt !== b.isExempt) return a.isExempt ? -1 : 1;
      const rateA = a.effectiveRatePercent ?? 0;
      const rateB = b.effectiveRatePercent ?? 0;
      if (rateA !== rateB) return rateA - rateB;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [taxCodesQuery.data]);

  const exchangeRateString =
    typeof watchedExchangeRate === "string" ? watchedExchangeRate : String(watchedExchangeRate ?? "");

  const previewTotals = useMemo(() => {
    const base = getDocumentPreviewTotals((watchedLines ?? []).map(toDocumentLinePreview));
    const subtotal = Number(base.subtotal) || 0;
    const discount = Number(base.discountTotal) || 0;
    const tax = Number(base.taxTotal) || 0;
    const total = Number(base.total) || 0;
    // Document-level discount may not be in line preview — approximate from form when set
    let headerDiscount = discount;
    if (watchedDiscountType === "PERCENTAGE") {
      headerDiscount = (subtotal * (Number(watchedDiscountValue) || 0)) / 100;
    } else if (watchedDiscountType === "FIXED") {
      headerDiscount = Number(watchedDiscountValue) || 0;
    }
    const adjustedTotal = subtotal - headerDiscount + tax;
    const incomeWhtAmount = previewWhtAmount({
      enabled: Boolean(watchedIncomeWhtEnabled),
      rate: watchedIncomeWhtRate as string | number | null | undefined,
      base: watchedIncomeWhtBase as string | null | undefined,
      subtotal,
      discount: headerDiscount,
      tax,
      total: adjustedTotal,
    });
    const salesTaxWhtAmount = previewWhtAmount({
      enabled: Boolean(watchedSalesTaxWhtEnabled),
      rate: watchedSalesTaxWhtRate as string | number | null | undefined,
      base: watchedSalesTaxWhtBase as string | null | undefined,
      subtotal,
      discount: headerDiscount,
      tax,
      total: adjustedTotal,
    });
    const whtAmount = incomeWhtAmount + salesTaxWhtAmount;
    return {
      ...base,
      discountTotal: String(headerDiscount),
      total: String(adjustedTotal),
      incomeWhtAmount: String(incomeWhtAmount),
      salesTaxWhtAmount: String(salesTaxWhtAmount),
      whtAmount: String(whtAmount),
      netSettlementAmount: String(
        previewDualNetSettlement(adjustedTotal, [
          {
            amount: incomeWhtAmount,
            addsToCash: whtSettlementAddsToCash(
              watchedIncomeWhtHeldBy || watchedWhtHeldBy,
              "bill",
            ),
          },
          {
            amount: salesTaxWhtAmount,
            addsToCash: whtSettlementAddsToCash(
              watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
              "bill",
            ),
          },
        ]),
      ),
    };
  }, [
    watchedLines,
    watchedIncomeWhtEnabled,
    watchedIncomeWhtRate,
    watchedIncomeWhtBase,
    watchedIncomeWhtHeldBy,
    watchedSalesTaxWhtEnabled,
    watchedSalesTaxWhtRate,
    watchedSalesTaxWhtBase,
    watchedSalesTaxWhtHeldBy,
    watchedWhtHeldBy,
    watchedDiscountType,
    watchedDiscountValue,
  ]);

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  const [showAccountColumn, setShowAccountColumn] = useState(false);
  const hasLineAccountOverrides = (watchedLines ?? []).some((line) =>
    Boolean(line.expenseAccountId),
  );
  const accountColumnVisible = showAccountColumn || hasLineAccountOverrides;

  const onInvalid = () => {
    validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyItemToLine = (lineIndex: number, item: {
    id: string;
    name: string;
    description?: string | null;
    purchaseCost?: string | null;
    expenseAccountId?: string | null;
    assetAccountId?: string | null;
    unitName?: string | null;
  }) => {
    const basePrice = Number(item.purchaseCost ?? "0");
    const price = convertBasePriceToDocumentPrice(
      basePrice,
      exchangeRateString || undefined,
      form.getValues("currencyCode") || getCompanyBaseCurrency(company),
      getCompanyBaseCurrency(company),
    );
    form.setValue(`lines.${lineIndex}.itemId`, item.id, { shouldDirty: true, shouldValidate: true });
    form.setValue(`lines.${lineIndex}.itemName`, item.name, { shouldDirty: true });
    form.setValue(`lines.${lineIndex}.unitName`, item.unitName ?? "", { shouldDirty: true });
    form.setValue(`lines.${lineIndex}.description`, item.description || item.name, { shouldDirty: true });
    form.setValue(`lines.${lineIndex}.unitCost`, toDecimalString(price), {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (item.expenseAccountId || item.assetAccountId) {
      form.setValue(
        `lines.${lineIndex}.expenseAccountId`,
        item.expenseAccountId ?? item.assetAccountId ?? "",
        { shouldDirty: true },
      );
    }
  };

  if (!canManage) {
    return (
      <Alert
        description="Your current company membership does not include bill management."
        title="Bill editing is unavailable"
        variant="destructive"
      />
    );
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/bills`}>Back to bills</Link>
            </Button>
          }
          description={
            mode === "create"
              ? "Create a vendor bill (purchase invoice) with payable line items."
              : "Edit this vendor bill (purchase invoice)."
          }
          eyebrow="Payables"
          title={mode === "create" ? "New bill (purchase invoice)" : "Edit bill"}
        />
      }
    >
      {billQuery.error ? (
        <ErrorState description={billQuery.error.message} title="Unable to load bill" />
      ) : null}

      <form
        
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            vendorId: values.vendorId,
            billNumber: values.billNumber || undefined,
            referenceNumber: values.referenceNumber || undefined,
            issueDate: values.issueDate || undefined,
            dueDate: values.dueDate || undefined,
            currencyCode: values.currencyCode || undefined,
            exchangeRate: resolveDocumentExchangeRate(company, values.currencyCode, values.exchangeRate),
            notes: values.notes || undefined,
            discountType: values.discountType || undefined,
            discountValue: values.discountValue
              ? toOptionalDecimalString(values.discountValue)
              : undefined,
            whtEnabled: Boolean(values.incomeWhtEnabled || values.salesTaxWhtEnabled),
            incomeWhtEnabled: Boolean(values.incomeWhtEnabled),
            salesTaxWhtEnabled: Boolean(values.salesTaxWhtEnabled),
            ...(values.incomeWhtEnabled || values.salesTaxWhtEnabled
              ? {
                  whtHeldBy: (values.incomeWhtHeldBy ||
                    values.salesTaxWhtHeldBy ||
                    values.whtHeldBy) as "COMPANY" | "COUNTERPARTY",
                }
              : {}),
            ...(values.incomeWhtEnabled
              ? {
                  incomeWhtRate: values.incomeWhtRate
                    ? toOptionalDecimalString(values.incomeWhtRate)
                    : undefined,
                  incomeWhtBase: values.incomeWhtBase as
                    | "SUBTOTAL"
                    | "TAXABLE"
                    | "TAX_AMOUNT"
                    | "TOTAL",
                  incomeWhtHeldBy: (values.incomeWhtHeldBy ||
                    values.whtHeldBy) as "COMPANY" | "COUNTERPARTY",
                }
              : {}),
            ...(values.salesTaxWhtEnabled
              ? {
                  salesTaxWhtRate: values.salesTaxWhtRate
                    ? toOptionalDecimalString(values.salesTaxWhtRate)
                    : undefined,
                  salesTaxWhtBase: values.salesTaxWhtBase as
                    | "SUBTOTAL"
                    | "TAXABLE"
                    | "TAX_AMOUNT"
                    | "TOTAL",
                  salesTaxWhtHeldBy: (values.salesTaxWhtHeldBy ||
                    values.whtHeldBy) as "COMPANY" | "COUNTERPARTY",
                }
              : {}),
            lines: values.lines.map((line) => ({
              description: line.description,
              quantity: toDecimalString(line.quantity),
              unitCost: toDecimalString(line.unitCost),
              ...(line.itemId ? { itemId: line.itemId } : {}),
              ...(line.expenseAccountId ? { expenseAccountId: line.expenseAccountId } : {}),
              ...(line.taxCodeId ? { taxCodeId: line.taxCodeId } : {}),
              ...(line.discountType ? { discountType: line.discountType } : {}),
              ...(line.discountValue
                ? { discountValue: toOptionalDecimalString(line.discountValue) }
                : {}),
            })),
          };

          const result =
            mode === "create"
              ? await createMutation.mutateAsync(payload)
              : await updateMutation.mutateAsync(payload);

          navigate(`/app/company/${companyId}/bills/${result.id}`);
        }, onInvalid)}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
          <div ref={validationSummaryRef}>
            <FormValidationSummary
              errors={form.formState.errors}
              submitCount={form.formState.submitCount}
            />
          </div>

          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}

          <FormSection title="Bill header">
            <FieldGrid>
              <CounterpartySelect
                createLabel="Create new vendor…"
                error={form.formState.errors.vendorId?.message}
                label="Vendor"
                onChange={(value) => form.setValue("vendorId", value, { shouldValidate: true })}
                onCreateNew={() => {
                  createVendorMutation.reset();
                  setVendorDrawerOpen(true);
                }}
                options={(vendorsQuery.data ?? []).map((vendor) => ({
                  id: vendor.id,
                  label: vendor.displayName,
                  secondary: vendor.vendorCode ?? undefined,
                }))}
                placeholder="Select vendor"
                value={form.watch("vendorId")}
              />
              <FormField
                error={form.formState.errors.billNumber?.message}
                helperText="Optional — auto BILL-01 if left blank"
                label="Bill no / Purchase invoice no"
              >
                <Input {...form.register("billNumber")} placeholder="BILL-01" />
              </FormField>
              <FormField
                error={form.formState.errors.referenceNumber?.message}
                label="Reference number"
              >
                <Input {...form.register("referenceNumber")} placeholder="Vendor ref" />
              </FormField>
              <DocumentCurrencyFields<BillFormInput>
                company={company}
                companyId={companyId}
                control={form.control}
                currencyLocked={Boolean(watchedVendorId)}
                documentCurrencyCode={watchedCurrencyCode}
                errors={form.formState.errors}
                exchangeRateValue={exchangeRateString}
                register={form.register}
                setValue={form.setValue}
              />
              <FormField error={form.formState.errors.issueDate?.message} label="Issue date">
                <Input type="date" {...form.register("issueDate")} />
              </FormField>
              <FormField error={form.formState.errors.dueDate?.message} label="Due date">
                <Input type="date" {...form.register("dueDate")} />
              </FormField>
            </FieldGrid>
          </FormSection>
        </div>
          <div className="space-y-4">
          <DocumentTotalsCard
            currencyCode={form.watch("currencyCode")}
            discountTotal={previewTotals.discountTotal}
            subtotal={previewTotals.subtotal}
            taxTotal={previewTotals.taxTotal}
            title="Provisional totals"
            total={previewTotals.total}
            whtAmount={watchedEitherWht ? previewTotals.whtAmount : undefined}
            incomeWhtAmount={watchedEitherWht ? previewTotals.incomeWhtAmount : undefined}
            salesTaxWhtAmount={watchedEitherWht ? previewTotals.salesTaxWhtAmount : undefined}
            netSettlementAmount={
              watchedEitherWht ? previewTotals.netSettlementAmount : undefined
            }
            netLabel={whtNetLabel(
              watchedIncomeWhtHeldBy || watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
              "bill",
            )}
            whtAddsToTotal={whtSettlementAddsToCash(
              watchedIncomeWhtHeldBy || watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
              "bill",
            )}
            incomeWhtAddsToTotal={whtSettlementAddsToCash(
              watchedIncomeWhtHeldBy || watchedWhtHeldBy,
              "bill",
            )}
            salesTaxWhtAddsToTotal={whtSettlementAddsToCash(
              watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
              "bill",
            )}
            incomeWhtHeldByLabel={whtHeldByLabel(
              watchedIncomeWhtHeldBy || watchedWhtHeldBy,
              "bill",
              company?.name ?? company?.legalName,
            )}
            salesTaxWhtHeldByLabel={whtHeldByLabel(
              watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
              "bill",
              company?.name ?? company?.legalName,
            )}
          />
          <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium">Withholding tax</p>
            <WhtSettingsFields
              companyName={company?.name ?? company?.legalName}
              documentKind="bill"
              form={form}
            />
          </div>
          <Button className="w-full" isLoading={activeMutation.isPending} type="submit">
            {mode === "create" ? "Create bill" : "Save bill"}
          </Button>
        </div>
          </div>
        
        <div className="min-w-0 space-y-6">
          <FormSection title="Line items">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={accountColumnVisible}
                onChange={(event) => setShowAccountColumn(event.target.checked)}
              />
              <span>Advanced: choose an expense account per line (optional)</span>
            </label>
            {form.formState.errors.lines?.message ? (
              <p className="text-sm text-destructive">{String(form.formState.errors.lines.message)}</p>
            ) : null}
            <LineItemsEditor<BillFormInput>
              accountOptions={accountsQuery.data ?? []}
              baseCurrencyCode={getCompanyBaseCurrency(company)}
              control={form.control}
              createItemLabel="Create new item…"
              currencyCode={form.watch("currencyCode")}
              errors={form.formState.errors}
              exchangeRate={exchangeRateString}
              itemOptions={(itemsQuery.data ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                salesPrice: item.salesPrice,
                purchaseCost: item.purchaseCost,
                preferredVendorId: item.preferredVendorId,
                unitName: item.unitName,
              }))}
              mode="purchase"
              name={"lines"}
              onCreateItemForLine={(lineIndex) => {
                createItemMutation.reset();
                setItemCreateLineIndex(lineIndex);
                setItemDrawerOpen(true);
              }}
              preferredVendorId={watchedVendorId || undefined}
              setValue={form.setValue}
              showAccountColumn={accountColumnVisible}
              taxCodeOptions={purchaseTaxCodeOptions}
            />
          </FormSection>
        </div>

        <div className="min-w-0 space-y-6">
          <FormSection title="Notes and discounts">
            <FieldGrid>
              <FormField
                error={form.formState.errors.discountType?.message}
                label="Document discount type"
              >
                <Select
                  onChange={(event) =>
                    form.setValue(
                      "discountType",
                      (event.target.value || undefined) as BillFormValues["discountType"],
                    )
                  }
                  value={form.watch("discountType") ?? ""}
                >
                  <option value="">No discount</option>
                  <option value="FIXED">Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </Select>
              </FormField>
              <FormField
                error={form.formState.errors.discountValue?.message}
                label="Document discount value"
              >
                <Input step="0.01" type="number" {...form.register("discountValue")} />
              </FormField>
            </FieldGrid>
            <FormField error={form.formState.errors.notes?.message} label="Notes">
              <Textarea {...form.register("notes")} placeholder="Internal bill notes" />
            </FormField>
          </FormSection>
        </div>
      </form>

      <VendorFormDrawer
        companyCurrency={getCompanyBaseCurrency(company)}
        companyId={companyId}
        error={createVendorMutation.error}
        isPending={createVendorMutation.isPending}
        mode="create"
        onClose={() => {
          setVendorDrawerOpen(false);
          createVendorMutation.reset();
        }}
        onSubmit={async (values: VendorFormValues) => {
          const legalName = values.legalName.trim();
          const displayName = values.displayName?.trim() || legalName;
          const vendor = await createVendorMutation.mutateAsync({
            ...values,
            vendorCode: values.vendorCode || undefined,
            legalName,
            displayName,
            contactPersonName: values.contactPersonName || undefined,
            email: values.email || undefined,
            phone: values.phone || undefined,
            mobile: values.mobile || undefined,
            website: values.website || undefined,
            taxRegistrationNumber: values.taxRegistrationNumber || undefined,
            currencyCode: values.currencyCode || undefined,
            paymentTermsDays:
              values.paymentTermsDays === undefined || Number.isNaN(values.paymentTermsDays)
                ? 15
                : Number(values.paymentTermsDays),
            openingBalance: values.openingBalance || "0",
            openingBalanceDate: values.openingBalanceDate || undefined,
            billingAddressLine1: values.billingAddressLine1 || undefined,
            billingAddressLine2: values.billingAddressLine2 || undefined,
            billingCity: values.billingCity || undefined,
            billingState: values.billingState || undefined,
            billingPostalCode: values.billingPostalCode || undefined,
            billingCountry: values.billingCountry || undefined,
            notes: values.notes || undefined,
          });
          await queryClient.invalidateQueries({ queryKey: ["companies", companyId, "vendors"] });
          form.setValue("vendorId", vendor.id, { shouldValidate: true, shouldDirty: true });
          setVendorDrawerOpen(false);
        }}
        open={vendorDrawerOpen}
      />

      <ItemFormDrawer
        accounts={accountsQuery.data ?? []}
        baseCurrencyCode={getCompanyBaseCurrency(company)}
        error={createItemMutation.error}
        hsCodeCategories={hsCodeCategoriesQuery.data ?? []}
        isPending={createItemMutation.isPending}
        mode="create"
        onClose={() => {
          setItemDrawerOpen(false);
          setItemCreateLineIndex(null);
          createItemMutation.reset();
        }}
        onSubmit={async (values: ItemFormValues) => {
          const item = await createItemMutation.mutateAsync({
            ...values,
            itemCode: values.itemCode || undefined,
            description: values.description || undefined,
            sku: values.sku || undefined,
            barcode: values.barcode?.trim() || null,
            unitName: values.unitName || "ea",
            hsCodeCategoryId: values.hsCodeCategoryId || null,
            salesPrice: values.salesPrice || "0",
            purchaseCost: values.purchaseCost || "0",
            incomeAccountId: values.incomeAccountId || undefined,
            expenseAccountId: values.expenseAccountId || undefined,
            assetAccountId: values.assetAccountId || undefined,
            preferredVendorId: values.preferredVendorId || watchedVendorId || undefined,
            taxRateId: values.taxRateId,
            taxable: values.taxable || Boolean(values.taxRateId),
            reorderLevel: values.reorderLevel || undefined,
            quantityOnHand: values.quantityOnHand || undefined,
          });
          await queryClient.invalidateQueries({ queryKey: ["companies", companyId, "items"] });
          if (itemCreateLineIndex != null) {
            applyItemToLine(itemCreateLineIndex, item);
          }
          setItemDrawerOpen(false);
          setItemCreateLineIndex(null);
        }}
        open={itemDrawerOpen}
        taxRates={taxRatesQuery.data ?? []}
        vendors={vendorsQuery.data ?? []}
      />
    </PageContainer>
  );
}
