import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { DocumentTotalsCard } from "@/components/documents/document-totals-card";
import { LineItemsEditor } from "@/components/documents/line-items-editor";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import {
  useCreateEstimate,
  useEstimate,
  useUpdateEstimate,
} from "@/features/estimates/hooks/use-estimates";
import {
  estimateSchema,
  type EstimateFormInput,
  type EstimateFormValues,
} from "@/features/estimates/schemas/estimate.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { getDocumentPreviewTotals } from "@/features/shared/utils/document-calculations";

interface EstimateFormPageProps {
  mode: "create" | "edit";
}

export function EstimateFormPage({ mode }: EstimateFormPageProps) {
  const navigate = useNavigate();
  const { estimateId } = useParams();
  const { companyId, company, permissions } = useActiveCompany();
  const customersQuery = useCustomerOptions(companyId);
  const itemsQuery = useItemOptions(companyId);
  const estimateQuery = useEstimate(companyId, mode === "edit" ? estimateId ?? null : null);
  const createMutation = useCreateEstimate(companyId);
  const updateMutation = useUpdateEstimate(companyId, estimateId ?? null);
  const canManage = canManageEntity(permissions, "estimates");

  const form = useForm<EstimateFormInput, undefined, EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    values:
      mode === "edit" && estimateQuery.data
        ? {
            customerId: estimateQuery.data.customerId,
            estimateNumber: estimateQuery.data.estimateNumber ?? "",
            referenceNumber: estimateQuery.data.referenceNumber ?? "",
            issueDate: estimateQuery.data.issueDate ?? "",
            expiryDate: estimateQuery.data.expiryDate ?? "",
            currencyCode: estimateQuery.data.currencyCode ?? company?.currency ?? "USD",
            notes: estimateQuery.data.notes ?? "",
            terms: estimateQuery.data.terms ?? "",
            discountType: estimateQuery.data.discountType ?? undefined,
            discountValue: estimateQuery.data.discountValue ?? undefined,
            lines:
              estimateQuery.data.lines?.map((line) => ({
                itemId: line.itemId ?? "",
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice ?? undefined,
                discountType: line.discountType ?? undefined,
                discountValue: line.discountValue ?? undefined,
                taxCode: line.taxCode ?? "",
              })) ?? [],
          }
        : {
            customerId: "",
            estimateNumber: "",
            referenceNumber: "",
            issueDate: "",
            expiryDate: "",
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
                taxCode: "",
              },
            ],
          },
  });

  useFieldArray({ control: form.control, name: "lines" });
  const watchedLines = form.watch("lines");
  const previewTotals = useMemo(
    () =>
      getDocumentPreviewTotals(
        (watchedLines ?? []).map((line) => ({
          itemId: line.itemId || undefined,
          description: line.description,
          quantity: Number(line.quantity || 0),
          unitPrice: Number(line.unitPrice || 0),
          unitCost: undefined,
          discountType: line.discountType,
          discountValue: Number(line.discountValue || 0),
          taxCode: line.taxCode || undefined,
          expenseAccountId: undefined,
        })),
      ),
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
          description="Build a customer-facing estimate with line items and commercial terms."
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
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            ...values,
            estimateNumber: values.estimateNumber || undefined,
            referenceNumber: values.referenceNumber || undefined,
            issueDate: values.issueDate || undefined,
            expiryDate: values.expiryDate || undefined,
            currencyCode: values.currencyCode || undefined,
            notes: values.notes || undefined,
            terms: values.terms || undefined,
            discountValue:
              values.discountValue === undefined ? null : Number(values.discountValue),
            lines: values.lines.map((line) => ({
              itemId: line.itemId || null,
              description: line.description,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice || 0),
              discountType: line.discountType || undefined,
              discountValue:
                line.discountValue === undefined ? null : Number(line.discountValue),
              taxCode: line.taxCode || undefined,
            })),
          };

          const result =
            mode === "create"
              ? await createMutation.mutateAsync(payload)
              : await updateMutation.mutateAsync(payload);

          navigate(`/app/company/${companyId}/estimates/${result.id}`);
        })}
      >
        <div className="space-y-6">
          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}

          <FormSection title="Estimate header" description="Reference details and customer selection.">
            <FieldGrid>
              <CounterpartySelect
                error={form.formState.errors.customerId?.message}
                label="Customer"
                onChange={(value) => form.setValue("customerId", value)}
                options={(customersQuery.data ?? []).map((customer) => ({
                  id: customer.id,
                  label: customer.displayName,
                  secondary: customer.customerCode ?? undefined,
                }))}
                placeholder="Select customer"
                value={form.watch("customerId")}
              />
              <FormField label="Estimate number">
                <Input {...form.register("estimateNumber")} placeholder="EST-00012" />
              </FormField>
              <FormField label="Reference number">
                <Input {...form.register("referenceNumber")} placeholder="PO-1049" />
              </FormField>
              <FormField label="Currency">
                <Input {...form.register("currencyCode")} maxLength={3} placeholder="USD" />
              </FormField>
              <FormField label="Issue date">
                <Input type="date" {...form.register("issueDate")} />
              </FormField>
              <FormField label="Expiry date">
                <Input type="date" {...form.register("expiryDate")} />
              </FormField>
            </FieldGrid>
          </FormSection>

          <FormSection title="Line items" description="Frontend previews are provisional. Backend totals remain authoritative.">
            <LineItemsEditor
              control={form.control}
              currencyCode={form.watch("currencyCode")}
              itemOptions={itemsQuery.data ?? []}
              mode="sales"
              name={"lines"}
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
                  <option value="amount">Amount</option>
                  <option value="percentage">Percentage</option>
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
            {mode === "create" ? "Create estimate" : "Save estimate"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
