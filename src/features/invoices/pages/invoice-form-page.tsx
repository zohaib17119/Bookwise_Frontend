import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency, resolveDocumentExchangeRate } from "@/features/companies/utils/company-currency";
import { CustomerFormDrawer } from "@/features/customers/components/customer-form-drawer";
import {
  useCreateCustomer,
  useCustomerOptions,
} from "@/features/customers/hooks/use-customers";
import type { CustomerFormValues } from "@/features/customers/schemas/customer.schema";
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
import { normalizeDocumentTerms } from "@/features/shared/schemas/document.schema";
import type { DiscountType } from "@/features/shared/types/documents";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import { queryClient } from "@/lib/query/query-client";
import InvoiceEditorPage from "./invoice-editor-page";

const invoicePaymentOptions = ["BANK_TRANSFER", "CARD", "CASH", "CHEQUE"] as const;
type InvoicePaymentOption = (typeof invoicePaymentOptions)[number];

function normalizePaymentOptions(options?: string[] | null): InvoicePaymentOption[] {
  if (!options?.length) {
    return [];
  }

  return options.filter((option): option is InvoicePaymentOption =>
    invoicePaymentOptions.includes(option as InvoicePaymentOption),
  );
}

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
  const createCustomerMutation = useCreateCustomer(companyId);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
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
            terms: normalizeDocumentTerms(invoiceQuery.data.terms),
            memoOnStatement: invoiceQuery.data.memoOnStatement ?? "",
            paymentOptions: normalizePaymentOptions(invoiceQuery.data.paymentOptions),
            discountType: invoiceQuery.data.discountType ?? undefined,
            discountValue:
              invoiceQuery.data.discountValue != null
                ? toOptionalDecimalString(invoiceQuery.data.discountValue)
                : "",
            lines:
              invoiceQuery.data.lines?.map((line) => ({
                itemId: line.itemId ?? "",
                description: line.description,
                quantity: toDecimalString(line.quantity),
                unitPrice: line.unitPrice != null ? toOptionalDecimalString(line.unitPrice) : "",
                discountType: line.discountType ?? undefined,
                discountValue:
                  line.discountValue != null ? toOptionalDecimalString(line.discountValue) : "",
                taxCodeId: line.taxCodeId ?? "",
                taxRate: line.taxRate != null ? toOptionalDecimalString(line.taxRate) : "",
                itemName: line.itemName ?? "",
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
    <>
      <InvoiceEditorPage
        company={company}
        form={form}
        customersQuery={customersQuery}
        itemsQuery={itemsQuery}
        taxCodesQuery={taxCodesQuery}
        taxRatesQuery={taxRatesQuery}
        onCreateCustomer={() => {
          createCustomerMutation.reset();
          setCustomerDrawerOpen(true);
        }}
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
              description: line.description,
              quantity: String(line.quantity),
              unitPrice: String(line.unitPrice || ""),
              ...(line.itemId ? { itemId: line.itemId } : {}),
              ...(line.itemName ? { itemName: line.itemName } : {}),
              ...(line.discountType
                ? { discountType: line.discountType as DiscountType }
                : {}),
              ...(line.discountValue !== undefined
                ? { discountValue: String(line.discountValue) }
                : {}),
              ...(line.taxRateId ? { taxRateId: line.taxRateId } : {}),
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
        companyId={companyId ?? ""}
      />

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
    </>
  );
}
