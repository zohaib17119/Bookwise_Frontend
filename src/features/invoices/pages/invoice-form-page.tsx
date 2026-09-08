import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  convertBasePriceToDocumentPrice,
  getCompanyBaseCurrency,
  resolveDocumentExchangeRate,
} from "@/features/companies/utils/company-currency";
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
import { ItemFormDrawer } from "@/features/items/components/item-form-drawer";
import { useCreateItem, useItemOptions } from "@/features/items/hooks/use-items";
import { useHsCodeCategories } from "@/features/items/hooks/use-hs-code-categories";
import type { ItemFormValues } from "@/features/items/schemas/item.schema";
import type { Item } from "@/features/items/types/item.types";
import { useTaxCodes, useTaxRates } from "@/features/tax/hooks/use-tax";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { normalizeDocumentTerms } from "@/features/shared/schemas/document.schema";
import type { DiscountType } from "@/features/shared/types/documents";
import { toEditableDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";
import { useCounterpartyCurrencyDefault } from "@/features/shared/hooks/use-counterparty-currency-default";
import { buildContactPersonName } from "@/features/invoices/utils/contact-person";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
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

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0]! : value.slice(0, 10);
}

function ratesEqual(a: string | number | null | undefined, b: string | number | null | undefined) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return Math.abs(left - right) < 0.0001;
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
  const accountsQuery = useAccountOptions(companyId);
  const vendorsQuery = useVendorOptions(companyId);
  const hsCodeCategoriesQuery = useHsCodeCategories(companyId);
  const invoiceQuery = useInvoice(companyId, mode === "edit" ? invoiceId ?? null : null);
  const createMutation = useCreateInvoice(companyId);
  const updateMutation = useUpdateInvoice(companyId, invoiceId ?? null);
  const nextNumberQuery = useNextInvoiceNumber(companyId, mode === "create");
  const createCustomerMutation = useCreateCustomer(companyId);
  const createItemMutation = useCreateItem(companyId);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [itemCreateLineIndex, setItemCreateLineIndex] = useState<number | null>(null);
  const [itemCreateDefaultType, setItemCreateDefaultType] = useState<"inventory" | "service">(
    "inventory",
  );
  const canManage = canManageEntity(permissions, "invoices");

  const taxCodeIdByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const taxCode of taxCodesQuery.data ?? []) {
      if (taxCode.code) map.set(taxCode.code, taxCode.id);
    }
    return map;
  }, [taxCodesQuery.data]);

  const taxRateIdByPercent = useMemo(() => {
    const map = new Map<string, string>();
    for (const taxRate of taxRatesQuery.data ?? []) {
      const key = String(Number(taxRate.ratePercent));
      if (!map.has(key)) map.set(key, taxRate.id);
    }
    return map;
  }, [taxRatesQuery.data]);

  const form = useForm<InvoiceFormInput, undefined, InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    values:
      mode === "edit" && invoiceQuery.data
        ? {
            customerId: invoiceQuery.data.customerId,
            estimateId: invoiceQuery.data.estimateId ?? "",
            invoiceNumber: invoiceQuery.data.invoiceNumber ?? "",
            referenceNumber: invoiceQuery.data.referenceNumber ?? "",
            contactPersonName: invoiceQuery.data.contactPersonName ?? "",
            contactMobile: invoiceQuery.data.contactMobile ?? "",
            contactPersonDepartment: invoiceQuery.data.contactPersonDepartment ?? "",
            deliveryDate: toDateInputValue(invoiceQuery.data.deliveryDate),
            deliveryChallanNumber: invoiceQuery.data.deliveryChallanNumber ?? "",
            shippingAddressId: invoiceQuery.data.shippingAddressId ?? "",
            issueDate: toDateInputValue(invoiceQuery.data.issueDate),
            dueDate: toDateInputValue(invoiceQuery.data.dueDate),
            currencyCode: invoiceQuery.data.currencyCode ?? getCompanyBaseCurrency(company),
            exchangeRate: invoiceQuery.data.exchangeRate ?? "",
            notes: invoiceQuery.data.notes ?? "",
            terms: normalizeDocumentTerms(invoiceQuery.data.terms),
            memoOnStatement: invoiceQuery.data.memoOnStatement ?? "",
            paymentOptions: normalizePaymentOptions(invoiceQuery.data.paymentOptions),
            discountType: invoiceQuery.data.discountType ?? undefined,
            discountValue:
              invoiceQuery.data.discountValue != null
                ? toEditableDecimalString(invoiceQuery.data.discountValue)
                : "",
            whtEnabled: Boolean(invoiceQuery.data.whtEnabled),
            whtType: invoiceQuery.data.whtType ?? "",
            whtRate:
              invoiceQuery.data.whtRate != null
                ? toEditableDecimalString(invoiceQuery.data.whtRate)
                : "",
            whtBase: invoiceQuery.data.whtBase ?? "",
            whtHeldBy: invoiceQuery.data.whtHeldBy ?? "COUNTERPARTY",
            incomeWhtEnabled: Boolean(
              invoiceQuery.data.incomeWhtEnabled ??
                (invoiceQuery.data.whtEnabled && invoiceQuery.data.whtType === "INCOME"),
            ),
            incomeWhtRate:
              invoiceQuery.data.incomeWhtRate != null
                ? toEditableDecimalString(invoiceQuery.data.incomeWhtRate)
                : invoiceQuery.data.whtType === "INCOME" && invoiceQuery.data.whtRate != null
                  ? toEditableDecimalString(invoiceQuery.data.whtRate)
                  : "",
            incomeWhtBase:
              invoiceQuery.data.incomeWhtBase ??
              (invoiceQuery.data.whtType === "INCOME" ? invoiceQuery.data.whtBase ?? "" : ""),
            incomeWhtHeldBy:
              invoiceQuery.data.incomeWhtHeldBy ??
              invoiceQuery.data.whtHeldBy ??
              "COUNTERPARTY",
            salesTaxWhtEnabled: Boolean(
              invoiceQuery.data.salesTaxWhtEnabled ??
                (invoiceQuery.data.whtEnabled && invoiceQuery.data.whtType === "SALES_TAX"),
            ),
            salesTaxWhtRate:
              invoiceQuery.data.salesTaxWhtRate != null
                ? toEditableDecimalString(invoiceQuery.data.salesTaxWhtRate)
                : invoiceQuery.data.whtType === "SALES_TAX" && invoiceQuery.data.whtRate != null
                  ? toEditableDecimalString(invoiceQuery.data.whtRate)
                  : "",
            salesTaxWhtBase:
              invoiceQuery.data.salesTaxWhtBase ??
              (invoiceQuery.data.whtType === "SALES_TAX" ? invoiceQuery.data.whtBase ?? "" : ""),
            salesTaxWhtHeldBy:
              invoiceQuery.data.salesTaxWhtHeldBy ??
              invoiceQuery.data.whtHeldBy ??
              "COUNTERPARTY",
            lines:
              invoiceQuery.data.lines?.map((line) => {
                const taxCodeId =
                  line.taxCodeId ||
                  (line.taxCode ? taxCodeIdByCode.get(line.taxCode) : undefined) ||
                  "";
                const taxRateId =
                  line.taxRateId ||
                  (line.taxRate != null
                    ? taxRateIdByPercent.get(String(Number(line.taxRate)))
                    : undefined) ||
                  "";
                return {
                  itemId: line.itemId ?? "",
                  description: line.description,
                  quantity: toEditableDecimalString(line.quantity),
                  unitPrice: line.unitPrice != null ? toEditableDecimalString(line.unitPrice) : "",
                  discountType: line.discountType ?? undefined,
                  discountValue:
                    line.discountValue != null ? toEditableDecimalString(line.discountValue) : "",
                  taxCodeId,
                  taxRateId,
                  taxRate: line.taxRate != null ? toEditableDecimalString(line.taxRate) : "",
                  itemName: line.itemName ?? "",
                };
              }) ?? [],
          }
        : {
            customerId: "",
            estimateId: "",
            invoiceNumber: nextNumberQuery.data?.nextNumber ? String(nextNumberQuery.data.nextNumber) : "",
            referenceNumber: "",
            contactPersonName: "",
            contactMobile: "",
            contactPersonDepartment: "",
            deliveryDate: "",
            deliveryChallanNumber: "",
            shippingAddressId: "",
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
            whtEnabled: false,
            whtType: "",
            whtRate: "",
            whtBase: "",
            whtHeldBy: "COUNTERPARTY",
            incomeWhtEnabled: false,
            incomeWhtRate: "",
            incomeWhtBase: "",
            incomeWhtHeldBy: "COUNTERPARTY",
            salesTaxWhtEnabled: false,
            salesTaxWhtRate: "",
            salesTaxWhtBase: "",
            salesTaxWhtHeldBy: "COUNTERPARTY",
            lines: [
              {
                itemId: "",
                description: "",
                quantity: "1",
                unitPrice: "",
                discountType: undefined,
                discountValue: "",
                taxCodeId: "",
                taxRateId: "",
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

  // Keep taxRate in sync when taxRateId is resolved on edit load.
  const taxHydratedRef = useRef(false);
  useEffect(() => {
    if (mode !== "edit" || !invoiceQuery.data || taxHydratedRef.current) return;
    if (!taxRatesQuery.data?.length && !taxCodesQuery.data?.length) return;
    taxHydratedRef.current = true;
    const lines = form.getValues("lines") ?? [];
    lines.forEach((line, index) => {
      if (line.taxRateId && !line.taxRate) {
        const rate = taxRatesQuery.data?.find((row) => row.id === line.taxRateId);
        if (rate) {
          form.setValue(`lines.${index}.taxRate`, toEditableDecimalString(rate.ratePercent), {
            shouldDirty: false,
          });
        }
      } else if (!line.taxRateId && line.taxRate) {
        const match = taxRatesQuery.data?.find((row) =>
          ratesEqual(row.ratePercent, line.taxRate as string | number | null | undefined),
        );
        if (match) {
          form.setValue(`lines.${index}.taxRateId`, match.id, { shouldDirty: false });
        }
      }
    });
  }, [mode, invoiceQuery.data, taxRatesQuery.data, taxCodesQuery.data, form]);

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  const applyItemToLine = (lineIndex: number, item: Item) => {
    const lineOpts = { shouldDirty: true, shouldValidate: true } as const;
    const basePrice = Number(item.salesPrice ?? "0");
    const price = convertBasePriceToDocumentPrice(
      basePrice,
      form.getValues("exchangeRate") || undefined,
      form.getValues("currencyCode") || getCompanyBaseCurrency(company),
      getCompanyBaseCurrency(company),
    );
    form.setValue(`lines.${lineIndex}.itemId`, item.id, lineOpts);
    form.setValue(`lines.${lineIndex}.itemName`, item.name || "", lineOpts);
    form.setValue(`lines.${lineIndex}.description`, item.description || item.name, lineOpts);
    form.setValue(`lines.${lineIndex}.unitPrice`, toEditableDecimalString(price), lineOpts);
    form.setValue(`lines.${lineIndex}.taxRateId`, item.taxRateId ?? "", lineOpts);
  };

  if (!canManage) {
    return (
      <Alert
        title="Invoice editing is unavailable"
        description="Your current company membership does not include invoice management."
        variant="destructive"
      />
    );
  }

  if (mode === "edit" && invoiceQuery.isLoading) {
    return (
      <PageContainer>
        <div className="surface p-6">Loading invoice...</div>
      </PageContainer>
    );
  }

  if (mode === "edit" && (invoiceQuery.error || !invoiceQuery.data)) {
    return (
      <ErrorState
        title="Invoice not found"
        description={invoiceQuery.error?.message ?? "The requested invoice is unavailable."}
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
        onCreateItemForLine={(lineIndex, type) => {
          createItemMutation.reset();
          setItemCreateLineIndex(lineIndex);
          setItemCreateDefaultType(type);
          setItemDrawerOpen(true);
        }}
        onSubmit={async (values) => {
          const payload = {
            ...values,
            estimateId: values.estimateId || undefined,
            invoiceNumber: values.invoiceNumber || undefined,
            referenceNumber: values.referenceNumber || undefined,
            contactPersonName: values.contactPersonName || undefined,
            contactMobile: values.contactMobile || undefined,
            contactPersonDepartment: values.contactPersonDepartment || undefined,
            deliveryDate: values.deliveryDate || undefined,
            deliveryChallanNumber: values.deliveryChallanNumber || undefined,
            shippingAddressId: values.shippingAddressId || null,
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
              ...(line.taxCodeId ? { taxCodeId: line.taxCodeId } : {}),
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
        submitError={activeMutation.error}
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
            contactPersonDepartment: values.contactPersonDepartment || undefined,
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
          form.setValue(
            "contactPersonName",
            buildContactPersonName(customer.firstName, customer.lastName),
            { shouldDirty: true },
          );
          form.setValue("contactMobile", customer.mobile ?? customer.phone ?? "", { shouldDirty: true });
          form.setValue("contactPersonDepartment", customer.contactPersonDepartment ?? "", {
            shouldDirty: true,
          });
          setCustomerDrawerOpen(false);
        }}
        open={customerDrawerOpen}
      />

      <ItemFormDrawer
        accounts={accountsQuery.data ?? []}
        baseCurrencyCode={getCompanyBaseCurrency(company)}
        defaultType={itemCreateDefaultType}
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
            preferredVendorId: values.preferredVendorId || undefined,
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
    </>
  );
}
