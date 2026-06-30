import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency, resolveDocumentExchangeRate } from "@/features/companies/utils/company-currency";
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import {
  useCreateInvoice,
  useInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
} from "@/features/invoices/hooks/use-invoices";
import {
  invoiceSchema,
  type InvoiceFormInput,
  type InvoiceFormValues,
} from "@/features/invoices/schemas/invoice.schema";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { useTaxCodes, useTaxRates } from "@/features/tax/hooks/use-tax";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import type { DiscountType } from "@/features/shared/types/documents";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import InvoiceEditorPage from "./invoice-editor-page";

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
  const taxRatesQuery = useTaxRates(companyId);
  const invoiceQuery = useInvoice(companyId, mode === "edit" ? invoiceId ?? null : null);
  const createMutation = useCreateInvoice(companyId);
  const updateMutation = useUpdateInvoice(companyId, invoiceId ?? null);
  const nextNumberQuery = useNextInvoiceNumber(companyId, mode === "create");
  const canManage = canManageEntity(permissions, "invoices");

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
            currencyCode: invoiceQuery.data.currencyCode ?? getCompanyBaseCurrency(company),
            exchangeRate: invoiceQuery.data.exchangeRate ?? "",
            notes: invoiceQuery.data.notes ?? "",
            terms: invoiceQuery.data.terms ?? "",
            memoOnStatement: invoiceQuery.data.memoOnStatement ?? "",
            paymentOptions: invoiceQuery.data.paymentOptions ?? [],
            discountType: invoiceQuery.data.discountType ?? undefined,
            discountValue: invoiceQuery.data.discountValue ?? undefined,
            lines:
              invoiceQuery.data.lines?.map((line) => ({
                itemId: line.itemId ?? "",
                description: line.description,
                quantity: Number(line.quantity),
                unitPrice: line.unitPrice ?? undefined,
                discountType: line.discountType ?? undefined,
                discountValue: line.discountValue ?? undefined,
                taxCodeId: line.taxCodeId ?? "",
                taxRate: line.taxRate ?? undefined,
                itemName: line.itemName ??  "",
              })) ?? [],
          }
        : {
            customerId: "",
            estimateId: "",
            invoiceNumber: nextNumberQuery.data?.nextNumber ? String(nextNumberQuery.data.nextNumber) : "",
            referenceNumber: "",
            issueDate: new Date().toISOString().split("T")[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            currencyCode: getCompanyBaseCurrency(company),
            exchangeRate: "",
            notes: "",
            terms: "30",
            memoOnStatement: "",
            paymentOptions: [],
            discountType: undefined,
            discountValue: undefined,
            lines: [
              {
                itemId: "",
                description: "",
                quantity: 1,
                unitPrice: "",
                discountType: undefined,
                discountValue: "",
                taxCodeId: "",
                taxRate: "",
                itemName: "",
              },
            ],
          },
  });

  useCounterpartyCurrencyDefault({
    form,
    counterpartyId: form.watch("customerId"),
    counterparties: customersQuery.data ?? [],
    company,
    mode,
  });

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
    <InvoiceEditorPage
      company={company}
      form={form}
      customersQuery={customersQuery}
      itemsQuery={itemsQuery}
      taxCodesQuery={taxCodesQuery}
      taxRatesQuery={taxRatesQuery}
      onSubmit={async (values) => {
        const payload = {
          ...values,
          estimateId: values.estimateId || undefined,
          invoiceNumber: values.invoiceNumber || undefined,
          referenceNumber: values.referenceNumber || undefined,
          issueDate: values.issueDate || undefined,
          dueDate: values.dueDate || undefined,
          currencyCode: values.currencyCode || undefined,
          exchangeRate: resolveDocumentExchangeRate(company, values.currencyCode, values.exchangeRate),
          notes: values.notes || undefined,
          terms: values.terms || undefined,
          memoOnStatement: values.memoOnStatement || undefined,
          paymentOptions: values.paymentOptions?.length ? values.paymentOptions : undefined,
          discountType: values.discountType
            ? (values.discountType as DiscountType)
            : undefined,
          discountValue:
            values.discountValue === undefined
              ? undefined
              : String(values.discountValue),
          lines: values.lines.map((line: any) => ({
            itemId: line.itemId || null,
            description: line.description,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice || ""),
            discountType: line.discountType
              ? (line.discountType as DiscountType)
              : undefined,
            discountValue:
              line.discountValue === undefined
                ? undefined
                : String(line.discountValue),
            taxRateId: line.taxRateId || undefined,
            itemName: line.itemName || "",
          })),
        };
        const result =
          mode === "create"
            ? await createMutation.mutateAsync(payload)
            : await updateMutation.mutateAsync(payload);

        navigate(`/app/company/${companyId}/invoices/${result.id}`);
      }}
      isLoading={activeMutation.isPending}
      mode={mode}
      companyId={companyId}
    />
  );
}