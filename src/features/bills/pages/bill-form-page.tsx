import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useBill, useCreateBill, useUpdateBill } from "@/features/bills/hooks/use-bills";
import { billSchema, type BillFormInput, type BillFormValues } from "@/features/bills/schemas/bill.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { toDocumentLinePreview } from "@/features/shared/utils/api-payload";
import { getDocumentPreviewTotals } from "@/features/shared/utils/document-calculations";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import { getCompanyBaseCurrency, resolveDocumentExchangeRate } from "@/features/companies/utils/company-currency";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import { useTaxCodes } from "@/features/tax/hooks/use-tax";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";

interface BillFormPageProps {
  mode: "create" | "edit";
}

function buildCreateDefaults(company: ReturnType<typeof useActiveCompany>["company"]): BillFormInput {
  return {
    vendorId: "",
    billNumber: "",
    referenceNumber: "",
    issueDate: "",
    dueDate: "",
    currencyCode: getCompanyBaseCurrency(company),
    exchangeRate: "",
    notes: "",
    terms: "",
    discountType: undefined,
    discountValue: "",
    lines: [
      {
        itemId: "",
        description: "",
        quantity: "1",
        unitCost: "",
        itemName: "",
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
  const { company, permissions } = useActiveCompany();
  const vendorsQuery = useVendorOptions(companyId);
  const itemsQuery = useItemOptions(companyId);
  const accountsQuery = useAccountOptions(companyId);
  const taxCodesQuery = useTaxCodes(companyId);
  const billQuery = useBill(companyId, mode === "edit" ? billId ?? null : null);
  const createMutation = useCreateBill(companyId);
  const updateMutation = useUpdateBill(companyId, billId ?? null);
  const canManage = canManageEntity(permissions, "bills");
  const validationSummaryRef = useRef<HTMLDivElement>(null);

  const createDefaults = useMemo(() => buildCreateDefaults(company), [company]);

  const form = useForm<BillFormInput, undefined, BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: createDefaults,
  });

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
      lines:
        bill.lines?.map((line) => ({
          itemId: line.itemId ?? "",
          description: line.description,
          quantity: toDecimalString(line.quantity || "1"),
          unitCost: line.unitCost != null ? toOptionalDecimalString(line.unitCost) : "",
          itemName: line.itemName ?? "",
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

  const watchedLines = useWatch({ control: form.control, name: "lines" });
  const watchedVendorId = form.watch("vendorId");
  const watchedCurrencyCode = form.watch("currencyCode");
  const watchedExchangeRate = form.watch("exchangeRate");

  useCounterpartyCurrencyDefault({
    form,
    counterpartyId: watchedVendorId,
    counterparties: vendorsQuery.data ?? [],
    company,
    mode,
  });

  const purchaseTaxCodeOptions = useMemo(
    () =>
      (taxCodesQuery.data ?? [])
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
          isExempt: taxCode.isExempt,
          effectiveRatePercent:
            taxCode.rates?.reduce(
              (sum, rateLink) => sum + Number(rateLink.taxRate?.ratePercent ?? 0),
              0,
            ) ?? 0,
        })),
    [taxCodesQuery.data],
  );

  const exchangeRateString =
    typeof watchedExchangeRate === "string" ? watchedExchangeRate : String(watchedExchangeRate ?? "");

  const previewTotals = useMemo(
    () => getDocumentPreviewTotals((watchedLines ?? []).map(toDocumentLinePreview)),
    [watchedLines],
  );

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  const [showAccountColumn, setShowAccountColumn] = useState(false);
  const hasLineAccountOverrides = (watchedLines ?? []).some((line) =>
    Boolean(line.expenseAccountId),
  );
  const accountColumnVisible = showAccountColumn || hasLineAccountOverrides;

  const onInvalid = () => {
    validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          description="Create or edit a vendor bill with payable-focused line items."
          eyebrow="Payables"
          title={mode === "create" ? "New bill" : "Edit bill"}
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
                error={form.formState.errors.vendorId?.message}
                label="Vendor"
                onChange={(value) => form.setValue("vendorId", value, { shouldValidate: true })}
                options={(vendorsQuery.data ?? []).map((vendor) => ({
                  id: vendor.id,
                  label: vendor.displayName,
                  secondary: vendor.vendorCode ?? undefined,
                }))}
                placeholder="Select vendor"
                value={form.watch("vendorId")}
              />
              <FormField error={form.formState.errors.billNumber?.message} label="Bill number">
                <Input {...form.register("billNumber")} placeholder="BILL-00152" />
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
          />
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
              currencyCode={form.watch("currencyCode")}
              errors={form.formState.errors}
              exchangeRate={exchangeRateString}
              itemOptions={itemsQuery.data ?? []}
              mode="purchase"
              name={"lines"}
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
    </PageContainer>
  );
}
