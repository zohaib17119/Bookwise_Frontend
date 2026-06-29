import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useBill, useCreateBill, useUpdateBill } from "@/features/bills/hooks/use-bills";
import { billSchema, type BillFormInput, type BillFormValues } from "@/features/bills/schemas/bill.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { getDocumentPreviewTotals } from "@/features/shared/utils/document-calculations";
import { getCompanyBaseCurrency, resolveDocumentExchangeRate } from "@/features/companies/utils/company-currency";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";

interface BillFormPageProps {
  mode: "create" | "edit";
}

export function BillFormPage({ mode }: BillFormPageProps) {
  const navigate = useNavigate();
  const { billId, companyId } = useParams();
  const { company, permissions } = useActiveCompany();
  const vendorsQuery = useVendorOptions(companyId);
  const itemsQuery = useItemOptions(companyId);
  const accountsQuery = useAccountOptions(companyId);
  const billQuery = useBill(companyId, mode === "edit" ? billId ?? null : null);
  const createMutation = useCreateBill(companyId);
  const updateMutation = useUpdateBill(companyId, billId ?? null);
  const canManage = canManageEntity(permissions, "bills");

  const form = useForm<BillFormInput, undefined, BillFormValues>({
    resolver: zodResolver(billSchema),
    values:
      mode === "edit" && billQuery.data
        ? {
            vendorId: billQuery.data.vendorId,
            billNumber: billQuery.data.billNumber ?? "",
            referenceNumber: billQuery.data.referenceNumber ?? "",
            issueDate: billQuery.data.issueDate ?? "",
            dueDate: billQuery.data.dueDate ?? "",
            currencyCode: billQuery.data.currencyCode ?? getCompanyBaseCurrency(company),
            exchangeRate: billQuery.data.exchangeRate ?? "",
            notes: billQuery.data.notes ?? "",
            terms: "",
            discountType: billQuery.data.discountType ?? undefined,
            discountValue: billQuery.data.discountValue ?? undefined,
            lines:
              billQuery.data.lines?.map((line) => ({
                itemId: line.itemId ?? "",
                description: line.description,
                quantity: line.quantity,
                unitCost: line.unitCost ?? undefined,
                discountType: line.discountType ?? undefined,
                discountValue: line.discountValue ?? undefined,
                taxCode: line.taxCode ?? "",
                expenseAccountId: line.expenseAccountId ?? "",
              })) ?? [],
          }
        : {
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
            discountValue: undefined,
            lines: [
              {
                itemId: "",
                description: "",
                quantity: 1,
                unitCost: 0,
                discountType: undefined,
                discountValue: undefined,
                taxCode: "",
                expenseAccountId: "",
              },
            ],
          },
  });

  useFieldArray({ control: form.control, name: "lines" });
  const watchedLines = form.watch("lines");
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
  const previewTotals = useMemo(
    () =>
      getDocumentPreviewTotals(
        (watchedLines ?? []).map((line) => ({
          itemId: line.itemId || undefined,
          description: line.description,
          quantity: Number(line.quantity || 0),
          unitPrice: undefined,
          unitCost: Number(line.unitCost || 0),
          discountType: line.discountType,
          discountValue: Number(line.discountValue || 0),
          taxCode: line.taxCode || undefined,
          expenseAccountId: line.expenseAccountId || undefined,
        })),
      ),
    [watchedLines],
  );

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  const [showAccountColumn, setShowAccountColumn] = useState(false);
  // Reveal the per-line account picker automatically when a bill already has
  // explicit account overrides, so power users don't lose visibility on edit.
  const hasLineAccountOverrides = (watchedLines ?? []).some((line) =>
    Boolean(line.expenseAccountId),
  );
  const accountColumnVisible = showAccountColumn || hasLineAccountOverrides;

  if (!canManage) {
    return <Alert title="Bill editing is unavailable" description="Your current company membership does not include bill management." variant="destructive" />;
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={<Button asChild variant="ghost"><Link to={`/app/company/${companyId}/bills`}>Back to bills</Link></Button>}
          description="Create or edit a vendor bill with payable-focused line items."
          eyebrow="Payables"
          title={mode === "create" ? "New bill" : "Edit bill"}
        />
      }
    >
      {billQuery.error ? <ErrorState title="Unable to load bill" description={billQuery.error.message} /> : null}

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            ...values,
            billNumber: values.billNumber || undefined,
            referenceNumber: values.referenceNumber || undefined,
            issueDate: values.issueDate || undefined,
            dueDate: values.dueDate || undefined,
            currencyCode: values.currencyCode || undefined,
            exchangeRate: resolveDocumentExchangeRate(company, values.currencyCode, values.exchangeRate),
            notes: values.notes || undefined,
            discountValue: values.discountValue === undefined ? null : Number(values.discountValue),
            lines: values.lines.map((line) => ({
              itemId: line.itemId || null,
              description: line.description,
              quantity: Number(line.quantity),
              unitCost: Number(line.unitCost || 0),
              discountType: line.discountType || undefined,
              discountValue: line.discountValue === undefined ? null : Number(line.discountValue),
              taxCode: line.taxCode || undefined,
              expenseAccountId: line.expenseAccountId || null,
            })),
          };

          const result = mode === "create"
            ? await createMutation.mutateAsync(payload)
            : await updateMutation.mutateAsync(payload);

          navigate(`/app/company/${companyId}/bills/${result.id}`);
        })}
      >
        <div className="space-y-6">
          {activeMutation.error ? <Alert title={activeMutation.error.message} variant="destructive" /> : null}

          <FormSection title="Bill header">
            <FieldGrid>
              <CounterpartySelect
                error={form.formState.errors.vendorId?.message}
                label="Vendor"
                onChange={(value) => form.setValue("vendorId", value)}
                options={(vendorsQuery.data ?? []).map((vendor) => ({
                  id: vendor.id,
                  label: vendor.displayName,
                  secondary: vendor.vendorCode ?? undefined,
                }))}
                placeholder="Select vendor"
                value={form.watch("vendorId")}
              />
              <FormField label="Bill number">
                <Input {...form.register("billNumber")} placeholder="BILL-00152" />
              </FormField>
              <FormField label="Reference number">
                <Input {...form.register("referenceNumber")} placeholder="Vendor ref" />
              </FormField>
              <DocumentCurrencyFields
                company={company}
                companyId={companyId}
                control={form.control}
                currencyLocked={Boolean(watchedVendorId)}
                documentCurrencyCode={watchedCurrencyCode}
                errors={form.formState.errors}
                exchangeRateValue={watchedExchangeRate}
                register={form.register}
                setValue={form.setValue}
              />
              <FormField label="Issue date">
                <Input type="date" {...form.register("issueDate")} />
              </FormField>
              <FormField label="Due date">
                <Input type="date" {...form.register("dueDate")} />
              </FormField>
            </FieldGrid>
          </FormSection>

          <FormSection title="Line items">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={accountColumnVisible}
                onChange={(event) => setShowAccountColumn(event.target.checked)}
              />
              <span>
                Advanced: choose an expense account per line (optional)
              </span>
            </label>
            <LineItemsEditor
              accountOptions={accountsQuery.data ?? []}
              baseCurrencyCode={getCompanyBaseCurrency(company)}
              control={form.control}
              currencyCode={form.watch("currencyCode")}
              exchangeRate={watchedExchangeRate}
              itemOptions={itemsQuery.data ?? []}
              mode="purchase"
              name={"lines"}
              setValue={form.setValue}
              showAccountColumn={accountColumnVisible}
            />
          </FormSection>

          <FormSection title="Notes and discounts">
            <FieldGrid>
              <FormField label="Document discount type">
                <Select
                  onChange={(event) =>
                    form.setValue("discountType", (event.target.value || undefined) as BillFormValues["discountType"])
                  }
                  value={form.watch("discountType") ?? ""}
                >
                  <option value="">No discount</option>
                  <option value="amount">Amount</option>
                  <option value="percentage">Percentage</option>
                </Select>
              </FormField>
              <FormField label="Document discount value">
                <Input type="number" step="0.01" {...form.register("discountValue")} />
              </FormField>
            </FieldGrid>
            <FormField label="Notes">
              <Textarea {...form.register("notes")} placeholder="Internal bill notes" />
            </FormField>
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
      </form>
    </PageContainer>
  );
}
