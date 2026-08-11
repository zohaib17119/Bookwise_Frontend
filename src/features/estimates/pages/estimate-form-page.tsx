import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { DocumentCurrencyFields } from "@/components/documents/document-currency-fields";
import { DocumentTotalsCard } from "@/components/documents/document-totals-card";
import { LineItemsEditor } from "@/components/documents/line-items-editor";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency, resolveDocumentExchangeRate } from "@/features/companies/utils/company-currency";
import { CustomerFormDrawer } from "@/features/customers/components/customer-form-drawer";
import {
  useCreateCustomer,
  useCustomerOptions,
} from "@/features/customers/hooks/use-customers";
import type { CustomerFormValues } from "@/features/customers/schemas/customer.schema";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import {
  useCreateEstimate,
  useEstimate,
  useNextEstimateNumber,
  useUpdateEstimate,
} from "@/features/estimates/hooks/use-estimates";
import {
  estimateSchema,
  type EstimateFormInput,
  type EstimateFormValues,
} from "@/features/estimates/schemas/estimate.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { useTaxCodes } from "@/features/tax/hooks/use-tax";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import type { EstimatePayload } from "@/features/estimates/types/estimate.types";
import { normalizeDocumentTerms } from "@/features/shared/schemas/document.schema";
import { toDocumentLinePreview } from "@/features/shared/utils/api-payload";
import { getDocumentPreviewTotals } from "@/features/shared/utils/document-calculations";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import { queryClient } from "@/lib/query/query-client";

interface EstimateFormPageProps {
  mode: "create" | "edit";
}

function todayIsoDate() {
  return new Date().toISOString().split("T")[0]!;
}

function plusDaysIsoDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0]! : value.slice(0, 10);
}

export function EstimateFormPage({ mode }: EstimateFormPageProps) {
  const navigate = useNavigate();
  const { estimateId } = useParams();
  const { companyId, company, permissions } = useActiveCompany();
  const customersQuery = useCustomerOptions(companyId);
  const itemsQuery = useItemOptions(companyId);
  const taxCodesQuery = useTaxCodes(companyId);
  const estimateQuery = useEstimate(companyId, mode === "edit" ? estimateId ?? null : null);
  const nextEstimateNumberQuery = useNextEstimateNumber(companyId, mode === "create");
  const createMutation = useCreateEstimate(companyId);
  const updateMutation = useUpdateEstimate(companyId, estimateId ?? null);
  const createCustomerMutation = useCreateCustomer(companyId);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const referenceSyncedFromEstimateRef = useRef(true);
  const canManage = canManageEntity(permissions, "estimates");

  const form = useForm<EstimateFormInput, undefined, EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    values:
      mode === "edit" && estimateQuery.data
        ? {
            customerId: estimateQuery.data.customerId,
            estimateNumber: estimateQuery.data.estimateNumber ?? "",
            referenceNumber: estimateQuery.data.referenceNumber ?? "",
            issueDate: toDateInputValue(estimateQuery.data.issueDate),
            expiryDate: toDateInputValue(estimateQuery.data.expiryDate),
            currencyCode: estimateQuery.data.currencyCode ?? getCompanyBaseCurrency(company),
            exchangeRate: estimateQuery.data.exchangeRate ?? "",
            notes: estimateQuery.data.notes ?? "",
            terms: normalizeDocumentTerms(estimateQuery.data.terms),
            discountType: estimateQuery.data.discountType ?? undefined,
            discountValue:
              estimateQuery.data.discountValue != null
                ? toOptionalDecimalString(estimateQuery.data.discountValue)
                : "",
            lines:
              estimateQuery.data.lines?.map((line) => {
                const resolvedTaxCodeId =
                  line.taxCodeId ||
                  (line.taxCode
                    ? (taxCodesQuery.data ?? []).find((taxCode) => taxCode.code === line.taxCode)?.id
                    : undefined) ||
                  "";
                return {
                  itemId: line.itemId ?? "",
                  description: line.description,
                  quantity: toDecimalString(line.quantity),
                  unitPrice: line.unitPrice != null ? toOptionalDecimalString(line.unitPrice) : "",
                  discountType: line.discountType ?? undefined,
                  discountValue:
                    line.discountValue != null ? toOptionalDecimalString(line.discountValue) : "",
                  taxCodeId: resolvedTaxCodeId,
                  taxRate: line.taxRate != null ? toOptionalDecimalString(line.taxRate) : "",
                };
              }) ?? [],
          }
        : {
            customerId: "",
            estimateNumber: "",
            referenceNumber: "",
            issueDate: todayIsoDate(),
            expiryDate: plusDaysIsoDate(30),
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
                unitPrice: "",
                discountType: undefined,
                discountValue: "",
                taxCodeId: "",
                taxRate: "",
              },
            ],
          },
  });

  useEffect(() => {
    if (mode !== "create" || !nextEstimateNumberQuery.data) return;
    if (form.getValues("estimateNumber")) return;
    const nextNumber = nextEstimateNumberQuery.data;
    form.setValue("estimateNumber", nextNumber, { shouldDirty: false });
    if (!form.getValues("referenceNumber")) {
      form.setValue("referenceNumber", nextNumber, { shouldDirty: false });
      referenceSyncedFromEstimateRef.current = true;
    }
  }, [mode, nextEstimateNumberQuery.data, form]);

  useFieldArray({ control: form.control, name: "lines" });
  const watchedLines = useWatch({ control: form.control, name: "lines" });
  const watchedCustomerId = form.watch("customerId");
  const watchedCurrencyCode = form.watch("currencyCode");
  const watchedExchangeRate = form.watch("exchangeRate");
  const watchedEstimateNumber = form.watch("estimateNumber");

  useCounterpartyCurrencyDefault({
    form,
    counterpartyId: watchedCustomerId,
    counterparties: customersQuery.data ?? [],
    company,
    mode,
  });

  useEffect(() => {
    if (mode !== "create") return;
    if (!referenceSyncedFromEstimateRef.current) return;
    if (!watchedEstimateNumber) return;
    form.setValue("referenceNumber", watchedEstimateNumber, { shouldDirty: false });
  }, [mode, watchedEstimateNumber, form]);

  const salesTaxCodeOptions = useMemo(() => {
    const options = (taxCodesQuery.data ?? [])
      .filter(
        (taxCode) =>
          !taxCode.scope || taxCode.scope === "SALES" || taxCode.scope === "BOTH",
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

  const taxCodeById = useMemo(() => {
    const map = new Map<string, { code: string; effectiveRatePercent: number }>();
    for (const option of salesTaxCodeOptions) {
      map.set(option.id, {
        code: option.code,
        effectiveRatePercent: option.effectiveRatePercent ?? 0,
      });
    }
    return map;
  }, [salesTaxCodeOptions]);

  const exchangeRateString =
    typeof watchedExchangeRate === "string" ? watchedExchangeRate : String(watchedExchangeRate ?? "");

  const previewTotals = useMemo(
    () => getDocumentPreviewTotals((watchedLines ?? []).map(toDocumentLinePreview)),
    [watchedLines],
  );

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  if (!canManage) {
    return (
      <Alert
        title="Estimate editing is unavailable"
        description="Your current company membership does not include estimate management."
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
              <Link to={`/app/company/${companyId}/estimates`}>Back to estimates</Link>
            </Button>
          }
          description="Build a customer-facing estimate or quotation with line items, tax, and commercial terms."
          eyebrow="Sales documents"
          title={mode === "create" ? "New estimate" : "Edit estimate"}
        />
      }
    >
      {estimateQuery.error ? (
        <ErrorState
          title="Unable to load estimate"
          description={estimateQuery.error.message}
        />
      ) : null}

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"
        onSubmit={form.handleSubmit(async (values) => {
          const payload: EstimatePayload = {
            customerId: values.customerId,
            estimateNumber: values.estimateNumber || undefined,
            referenceNumber: values.referenceNumber || undefined,
            issueDate: values.issueDate || undefined,
            expiryDate: values.expiryDate || undefined,
            currencyCode: values.currencyCode || undefined,
            exchangeRate: resolveDocumentExchangeRate(company, values.currencyCode, values.exchangeRate),
            notes: values.notes || undefined,
            terms: values.terms || undefined,
            ...(values.discountType ? { discountType: values.discountType } : {}),
            discountValue:
              values.discountValue === undefined || values.discountValue === null || values.discountValue === ""
                ? undefined
                : toOptionalDecimalString(values.discountValue),
            lines: values.lines.map((line) => {
              const taxMeta = line.taxCodeId ? taxCodeById.get(line.taxCodeId) : undefined;
              return {
                description: line.description,
                quantity: toDecimalString(line.quantity),
                unitPrice: toDecimalString(line.unitPrice ?? ""),
                ...(line.itemId ? { itemId: line.itemId } : {}),
                ...(line.discountType ? { discountType: line.discountType } : {}),
                ...(line.discountValue !== undefined && line.discountValue !== null && line.discountValue !== ""
                  ? { discountValue: toOptionalDecimalString(line.discountValue) }
                  : {}),
                ...(line.taxCodeId ? { taxCodeId: line.taxCodeId } : {}),
                ...(taxMeta?.code ? { taxCode: taxMeta.code } : {}),
                ...(line.taxRate !== undefined && line.taxRate !== null && line.taxRate !== ""
                  ? { taxRate: toOptionalDecimalString(line.taxRate) }
                  : taxMeta
                    ? { taxRate: toOptionalDecimalString(taxMeta.effectiveRatePercent) }
                    : {}),
              };
            }),
          };

          const result =
            mode === "create"
              ? await createMutation.mutateAsync(payload)
              : await updateMutation.mutateAsync(payload);

          navigate(`/app/company/${companyId}/estimates/${result.id}`);
        })}
      >
        <div className="min-w-0 space-y-6">
          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}

          <FormSection title="Estimate header" description="Customer, numbering, currency, and dates.">
            <FieldGrid>
              <CounterpartySelect
                createLabel="Create new customer…"
                error={form.formState.errors.customerId?.message}
                label="Customer"
                onChange={(value) => form.setValue("customerId", value, { shouldValidate: true })}
                onCreateNew={() => {
                  createCustomerMutation.reset();
                  setCustomerDrawerOpen(true);
                }}
                options={(customersQuery.data ?? []).map((customer) => ({
                  id: customer.id,
                  label: customer.displayName,
                  secondary: customer.customerCode ?? undefined,
                }))}
                placeholder="Search or select customer"
                value={form.watch("customerId")}
              />
              <FormField
                helperText="Auto-generated — you can edit before saving"
                label="Estimate number"
              >
                <Input {...form.register("estimateNumber")} placeholder="EST-01" />
              </FormField>
              <FormField
                helperText="Defaults to estimate number — editable"
                label="Reference number"
              >
                <Input
                  {...form.register("referenceNumber", {
                    onChange: () => {
                      referenceSyncedFromEstimateRef.current = false;
                    },
                  })}
                  placeholder="EST-01"
                />
              </FormField>
              <DocumentCurrencyFields<EstimateFormInput>
                company={company}
                companyId={companyId}
                control={form.control}
                currencyLocked={Boolean(watchedCustomerId)}
                documentCurrencyCode={watchedCurrencyCode}
                errors={form.formState.errors}
                exchangeRateValue={exchangeRateString}
                register={form.register}
                setValue={form.setValue}
              />
              <FormField label="Issue date">
                <Input type="date" {...form.register("issueDate")} />
              </FormField>
              <FormField label="Expiry date">
                <Input type="date" {...form.register("expiryDate")} />
              </FormField>
            </FieldGrid>
          </FormSection>

          <FormSection title="Line items" description="Add products/services and sales tax codes.">
            <LineItemsEditor<EstimateFormInput>
              baseCurrencyCode={getCompanyBaseCurrency(company)}
              control={form.control}
              currencyCode={form.watch("currencyCode")}
              exchangeRate={exchangeRateString}
              itemOptions={itemsQuery.data ?? []}
              mode="sales"
              name={"lines"}
              setValue={form.setValue}
              taxCodeOptions={salesTaxCodeOptions}
            />
          </FormSection>

          <FormSection title="Commercial terms">
            <FieldGrid>
              <FormField label="Document discount type">
                <Select
                  onChange={(event) =>
                    form.setValue(
                      "discountType",
                      (event.target.value || undefined) as EstimateFormValues["discountType"],
                    )
                  }
                  value={form.watch("discountType") ?? ""}
                >
                  <option value="">No discount</option>
                  <option value="FIXED">Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </Select>
              </FormField>
              <FormField label="Document discount value">
                <Input type="number" step="0.01" {...form.register("discountValue")} />
              </FormField>
            </FieldGrid>
            <FormField label="Terms">
              <Textarea {...form.register("terms")} placeholder="Payment and acceptance terms" />
            </FormField>
            <FormField label="Notes">
              <Textarea {...form.register("notes")} placeholder="Internal or customer-facing notes" />
            </FormField>
          </FormSection>
        </div>

        <div className="space-y-4 self-start xl:sticky xl:top-4">
          <DocumentTotalsCard
            currencyCode={form.watch("currencyCode")}
            discountTotal={previewTotals.discountTotal}
            subtotal={previewTotals.subtotal}
            taxTotal={previewTotals.taxTotal}
            title="Provisional totals"
            total={previewTotals.total}
          />
          <Button className="w-full" isLoading={activeMutation.isPending} type="submit">
            {mode === "create" ? "Create estimate" : "Save estimate"}
          </Button>
        </div>
      </form>

      <CustomerFormDrawer
        companyCurrency={getCompanyBaseCurrency(company)}
        companyId={companyId}
        error={createCustomerMutation.error}
        isPending={createCustomerMutation.isPending}
        mode="create"
        onClose={() => {
          setCustomerDrawerOpen(false);
          createCustomerMutation.reset();
        }}
        onSubmit={async (values: CustomerFormValues) => {
          const legalName = values.legalName.trim();
          const displayName = values.displayName?.trim() || legalName;
          const customer = await createCustomerMutation.mutateAsync({
            ...values,
            customerCode: values.customerCode || undefined,
            legalName,
            displayName,
            firstName: values.firstName || undefined,
            lastName: values.lastName || undefined,
            email: values.email || undefined,
            phone: values.phone || undefined,
            mobile: values.mobile || undefined,
            website: values.website || undefined,
            taxRegistrationNumber: values.taxRegistrationNumber || undefined,
            currencyCode: values.currencyCode || undefined,
            paymentTermsDays:
              values.paymentTermsDays === undefined || Number.isNaN(values.paymentTermsDays)
                ? 30
                : Number(values.paymentTermsDays),
            openingBalance: values.openingBalance || "0",
            openingBalanceDate: values.openingBalanceDate || undefined,
            billingAddressLine1: values.billingAddressLine1 || undefined,
            billingAddressLine2: values.billingAddressLine2 || undefined,
            billingCity: values.billingCity || undefined,
            billingState: values.billingState || undefined,
            billingPostalCode: values.billingPostalCode || undefined,
            billingCountry: values.billingCountry || undefined,
            shippingAddressLine1: values.shippingAddressLine1 || undefined,
            shippingAddressLine2: values.shippingAddressLine2 || undefined,
            shippingCity: values.shippingCity || undefined,
            shippingState: values.shippingState || undefined,
            shippingPostalCode: values.shippingPostalCode || undefined,
            shippingCountry: values.shippingCountry || undefined,
            notes: values.notes || undefined,
          });
          await queryClient.invalidateQueries({ queryKey: ["companies", companyId, "customers"] });
          form.setValue("customerId", customer.id, { shouldValidate: true, shouldDirty: true });
          setCustomerDrawerOpen(false);
        }}
        open={customerDrawerOpen}
      />
    </PageContainer>
  );
}
