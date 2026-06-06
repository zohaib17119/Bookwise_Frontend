import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Send,
  Save,
  Calendar,
  Hash,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { LineItemsEditor } from "@/components/documents/line-items-editor";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import {
  useCreateInvoice,
  useInvoice,
  useUpdateInvoice,
} from "@/features/invoices/hooks/use-invoices";
import {
  invoiceSchema,
  type InvoiceFormInput,
  type InvoiceFormValues,
} from "@/features/invoices/schemas/invoice.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { useTaxCodes } from "@/features/tax/hooks/use-tax";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { useEstimatesByCustomer } from "@/features/estimates/hooks/use-estimates";
import { formatDate } from "@/lib/utils/format";

interface InvoiceFormPageProps {
  mode: "create" | "edit";
}

export function InvoiceFormPage({ mode }: InvoiceFormPageProps) {
  const navigate = useNavigate();
  const { invoiceId, companyId } = useParams();
  const { company, permissions } = useActiveCompany();
  const customersQuery = useCustomerOptions(companyId);
  const itemsQuery = useItemOptions(companyId);
  const taxCodesQuery = useTaxCodes(companyId);
  const invoiceQuery = useInvoice(companyId, mode === "edit" ? invoiceId ?? null : null);
  const createMutation = useCreateInvoice(companyId);
  const updateMutation = useUpdateInvoice(companyId, invoiceId ?? null);
  const canManage = canManageEntity(permissions, "invoices");

  const taxCodeOptions = useMemo(() => {
    if (!taxCodesQuery.data) return [];
    return taxCodesQuery.data
      .filter((tc) => !tc.isExempt)
      .map((tc) => {
        const totalRate = (tc.rates ?? []).reduce(
          (sum, r) => sum + Number(r.taxRate.ratePercent ?? 0),
          0,
        );
        return {
          id: tc.id,
          name: tc.name,
          code: tc.code ?? undefined,
          calculationMode: tc.calculationMode ?? undefined,
          isExempt: tc.isExempt,
          effectiveRatePercent: totalRate,
        };
      });
  }, [taxCodesQuery.data]);

  const form = useForm<InvoiceFormInput, undefined, InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    values:
      mode === "edit" && invoiceQuery.data
        ? {
            customerId: invoiceQuery.data.customerId,
            estimateId: invoiceQuery.data.estimateId ?? "",
            invoiceNumber: invoiceQuery.data.invoiceNumber ?? "",
            referenceNumber: invoiceQuery.data.referenceNumber ?? "",
            issueDate: invoiceQuery.data.issueDate ?? "",
            dueDate: invoiceQuery.data.dueDate ?? "",
            currencyCode: invoiceQuery.data.currencyCode ?? company?.currency ?? "USD",
            notes: invoiceQuery.data.notes ?? "",
            terms: invoiceQuery.data.terms ?? "",
            discountType: invoiceQuery.data.discountType ?? undefined,
            discountValue: invoiceQuery.data.discountValue ?? undefined,
            lines:
              invoiceQuery.data.lines?.map((line) => ({
                itemId: line.itemId ?? "",
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice ?? undefined,
                discountType: line.discountType ?? undefined,
                discountValue: line.discountValue ?? undefined,
                taxCodeId: line.taxCodeId ?? "",
                taxRate: line.taxRate ?? undefined,
              })) ?? [],
          }
        : {
            customerId: "",
            estimateId: "",
            invoiceNumber: "",
            referenceNumber: "",
            issueDate: new Date().toISOString().split("T")[0],
            dueDate: "",
            currencyCode: company?.currency ?? "USD",
            notes: "",
            terms: "",
            discountType: undefined,
            discountValue: undefined,
            lines: [
              {
                itemId: "",
                description: "",
                quantity: 1,
                unitPrice: 0,
                discountType: undefined,
                discountValue: undefined,
                taxCodeId: "",
                taxRate: undefined,
              },
            ],
          },
  });

  const watchedCurrency = form.watch("currencyCode") || company?.currency || "USD";
  const watchedCustomerId = form.watch("customerId");
  const estimatesByCustomerQuery = useEstimatesByCustomer(companyId, watchedCustomerId || undefined);

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  if (!canManage) {
    return (
      <Alert
        title="Invoice editing is unavailable"
        description="Your current company membership does not include invoice management."
        variant="destructive"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              to={`/app/company/${companyId}/invoices`}
            >
              <ChevronLeft className="h-4 w-4" />
              Invoices
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight text-foreground">
                  {mode === "create" ? "New Invoice" : "Edit Invoice"}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="gap-2"
              isLoading={activeMutation.isPending}
              onClick={form.handleSubmit(async (values) => {
                const payload = {
                  ...values,
                  estimateId: values.estimateId || undefined,
                  invoiceNumber: values.invoiceNumber || undefined,
                  referenceNumber: values.referenceNumber || undefined,
                  issueDate: values.issueDate || undefined,
                  dueDate: values.dueDate || undefined,
                  currencyCode: values.currencyCode || undefined,
                  notes: values.notes || undefined,
                  terms: values.terms || undefined,
                  discountType: values.discountType
                    ? values.discountType === "FIXED"
                      ? "FIXED"
                      : "PERCENTAGE"
                    : undefined,
                  discountValue:
                    values.discountValue === undefined
                      ? undefined
                      : String(values.discountValue),
                  lines: values.lines.map((line) => ({
                    itemId: line.itemId || null,
                    description: line.description,
                    quantity: String(line.quantity),
                    unitPrice: String(line.unitPrice || 0),
                    discountType: line.discountType
                      ? line.discountType === "FIXED"
                        ? "FIXED"
                        : "PERCENTAGE"
                      : undefined,
                    discountValue:
                      line.discountValue === undefined
                        ? undefined
                        : String(line.discountValue),
                    taxCodeId: line.taxCodeId || undefined,
                  })),
                };
                const result =
                  mode === "create"
                    ? await createMutation.mutateAsync(payload)
                    : await updateMutation.mutateAsync(payload);

                navigate(
                  `/app/company/${companyId}/invoices/${result.id}`,
                );
              })}
              type="button"
            >
              {mode === "create" ? (
                <>
                  <Send className="h-4 w-4" />
                  Save & Send
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {invoiceQuery.error ? (
          <ErrorState
            title="Unable to load invoice"
            description={invoiceQuery.error.message}
          />
        ) : null}

        {activeMutation.error ? (
          <div className="mb-6">
            <Alert
              title={activeMutation.error.message}
              variant="destructive"
            />
          </div>
        ) : null}

        <div className="space-y-6">
          {/* Invoice header card */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Customer */}
              <div className="sm:col-span-2 lg:col-span-1">
                <CounterpartySelect
                  error={form.formState.errors.customerId?.message}
                  label="Customer"
                  onChange={(value) => form.setValue("customerId", value)}
                  options={(customersQuery.data ?? []).map((customer) => ({
                    id: customer.id,
                    label: customer.displayName,
                    secondary: customer.customerCode ?? undefined,
                  }))}
                  placeholder="Select or add a customer"
                  value={form.watch("customerId")}
                />
              </div>

              {/* Invoice number */}
              <FormField label="Invoice no.">
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...form.register("invoiceNumber")}
                    className="pl-9"
                    placeholder="Auto-generated"
                  />
                </div>
              </FormField>

              {/* Reference */}
              <FormField label="P.O. / S.O. number">
                <Input
                  {...form.register("referenceNumber")}
                  placeholder="Optional"
                />
              </FormField>

              {/* Estimate link */}
              <FormField label="Linked Estimate">
                <Select
                  {...form.register("estimateId")}
                  disabled={!watchedCustomerId || estimatesByCustomerQuery.isLoading}
                >
                  <option value="">
                    {watchedCustomerId 
                      ? (estimatesByCustomerQuery.isLoading ? "Loading..." : "No estimate")
                      : "Select customer first"}
                  </option>
                  {(estimatesByCustomerQuery.data ?? []).map((estimate) => (
                    <option key={estimate.id} value={estimate.id}>
                      {estimate.estimateNumber} - {formatDate(estimate.issueDate)}
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Issue date */}
              <FormField label="Invoice date">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    {...form.register("issueDate")}
                    className="pl-9"
                  />
                </div>
              </FormField>

              {/* Due date */}
              <FormField label="Due date">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    {...form.register("dueDate")}
                    className="pl-9"
                  />
                </div>
              </FormField>

              {/* Currency */}
              <FormField label="Currency">
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...form.register("currencyCode")}
                    className="pl-9"
                    maxLength={3}
                    placeholder="USD"
                  />
                </div>
              </FormField>

              {/* Document-level discount */}
              <FormField label="Discount">
                <div className="flex items-center gap-2">
                  <Select
                    className="h-10 w-[100px] rounded-lg text-sm"
                    onChange={(event) =>
                      form.setValue(
                        "discountType",
                        (event.target.value || undefined) as InvoiceFormValues["discountType"],
                      )
                    }
                    value={form.watch("discountType") ?? ""}
                  >
                    <option value="">None</option>
                    <option value="amount">$</option>
                    <option value="percentage">%</option>
                  </Select>
                  <Input
                    className="h-10 flex-1 rounded-lg text-right"
                    min="0"
                    step="0.01"
                    type="number"
                    {...form.register("discountValue")}
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Line Items
              </h2>
            </div>
            <LineItemsEditor
              control={form.control}
              currencyCode={watchedCurrency}
              docDiscountType={form.watch("discountType") ?? null}
              docDiscountValue={
                form.watch("discountValue") !== undefined
                  ? Number(form.watch("discountValue"))
                  : null
              }
              itemOptions={itemsQuery.data ?? []}
              mode="sales"
              name={"lines"}
              setValue={form.setValue}
              taxCodeOptions={taxCodeOptions}
            />
          </div>

          {/* Notes & Terms */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Message & Terms
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField label="Message on invoice">
                <Textarea
                  {...form.register("notes")}
                  className="min-h-[100px] resize-y"
                  placeholder="This will appear on the invoice..."
                />
              </FormField>
              <FormField label="Terms & conditions">
                <Textarea
                  {...form.register("terms")}
                  className="min-h-[100px] resize-y"
                  placeholder="Payment terms, late fees, etc."
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
