import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { WhtSettingsFields } from "@/features/shared/components/wht-settings-fields";
import { whtNetLabel, whtSettlementAddsToCash } from "@/features/shared/utils/wht-labels";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { DocumentCurrencyFields } from "@/components/documents/document-currency-fields";
import { getCompanyBaseCurrency, convertBasePriceToDocumentPrice } from "@/features/companies/utils/company-currency";
import { INVOICE_PAYMENT_OPTIONS } from "@/features/invoices/constants/payment-options";
import { formatCurrency, formatMoneyAmount } from "@/lib/utils/format";
import { previewDualNetSettlement, previewWhtAmount } from "@/features/shared/utils/withholding-tax-preview";
import { buildContactPersonName } from "@/features/invoices/utils/contact-person";
import { exclToIncl, inclToExcl } from "@/features/shared/utils/document-calculations";
import { toDecimalString } from "@/features/shared/utils/decimal-string";

const DOCUMENT_TERMS_DAYS = [0, 15, 30, 45, 60, 90] as const;

function termsFromPaymentDays(days: number): string {
  if ((DOCUMENT_TERMS_DAYS as readonly number[]).includes(days)) {
    return String(days);
  }
  return "30";
}

export default function InvoiceEditorPage({
  company,
  form,
  customersQuery,
  itemsQuery,
  taxCodesQuery,
  taxRatesQuery,
  onSubmit,
  isLoading,
  mode,
  companyId,
  onCreateCustomer,
  submitError,
}: {
  company: any;
  form: any;
  customersQuery: any;
  itemsQuery?: any;
  taxCodesQuery?: any;
  taxRatesQuery?: any;
  onSubmit: (values: any) => void;
  isLoading: boolean;
  mode: "create" | "edit";
  companyId: string;
  onCreateCustomer?: () => void;
  submitError?: { message: string } | null;
}) {
  const watchedCustomerId = form.watch("customerId");
  const watchedCurrencyCode = form.watch("currencyCode");
  const watchedExchangeRate = form.watch("exchangeRate");
  const watchedLines = useWatch({ control: form.control, name: "lines" }) || [];
  const watchedTerms = form.watch("terms");
  const watchedIssueDate = form.watch("issueDate");
  const watchedDiscountType = form.watch("discountType");
  const watchedDiscountValue = form.watch("discountValue");
  const watchedIncomeWhtEnabled = form.watch("incomeWhtEnabled");
  const watchedIncomeWhtRate = form.watch("incomeWhtRate");
  const watchedIncomeWhtBase = form.watch("incomeWhtBase");
  const watchedIncomeWhtHeldBy = form.watch("incomeWhtHeldBy");
  const watchedSalesTaxWhtEnabled = form.watch("salesTaxWhtEnabled");
  const watchedSalesTaxWhtRate = form.watch("salesTaxWhtRate");
  const watchedSalesTaxWhtBase = form.watch("salesTaxWhtBase");
  const watchedSalesTaxWhtHeldBy = form.watch("salesTaxWhtHeldBy");
  const watchedWhtHeldBy = form.watch("whtHeldBy");
  const watchedEitherWht = Boolean(watchedIncomeWhtEnabled || watchedSalesTaxWhtEnabled);
  const setLineValueOptions = { shouldDirty: true, shouldValidate: true } as const;
  const [editingUnitInclLineIndex, setEditingUnitInclLineIndex] = useState<number | null>(null);
  const [unitInclDraftByLine, setUnitInclDraftByLine] = useState<Record<number, string>>({});

  const handleUnitInclusiveChange = useCallback(
    (index: number, rawValue: string, taxPercent: number) => {
      setUnitInclDraftByLine((current) => ({ ...current, [index]: rawValue }));
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || rawValue.trim() === "") return;
      const unitEx = inclToExcl(parsed, taxPercent);
      form.setValue(`lines.${index}.unitPrice`, toDecimalString(unitEx), setLineValueOptions);
    },
    [form],
  );

  // Get item details by ID
  const getItemById = useCallback((itemId: string) => {
    return itemsQuery?.data?.find((item: any) => item.id === itemId);
  }, [itemsQuery?.data]);

  // Get tax code details by ID
  const getTaxCodeById = useCallback((taxCodeId: string) => {
    return taxCodesQuery?.data?.find((tc: any) => tc.id === taxCodeId);
  }, [taxCodesQuery?.data]);

  // Calculate effective tax rate from tax rate ID
  const getTaxRateFromCode = useCallback((taxRateId: string) => {
    const taxRate = taxRatesQuery?.data?.find((tr: any) => tr.id === taxRateId);
    if (taxRate) {
      return Number(taxRate.ratePercent || 0);
    }
    return 0;
  }, [taxRatesQuery?.data]);

  // Handle item selection - auto-populate rate, description, and tax
  const handleItemChange = (index: number, itemId: string) => {
    if (itemId === "__service__") {
      // Manual service entry - clear itemId but allow manual rate entry
      form.setValue(`lines.${index}.itemId`, "", setLineValueOptions);
      form.setValue(`lines.${index}.description`, "", setLineValueOptions);
      form.setValue(`lines.${index}.unitPrice`, "", setLineValueOptions);
      form.setValue(`lines.${index}.taxRateId`, "", setLineValueOptions);
      form.setValue(`lines.${index}.itemName`, "", setLineValueOptions);
      return;
    }
    
    const item = getItemById(itemId);
    
    if (item) {
      // Auto-populate from item
      form.setValue(`lines.${index}.itemId`, itemId, setLineValueOptions);
      form.setValue(`lines.${index}.description`, item.description || item.name, setLineValueOptions);
      form.setValue(
        `lines.${index}.unitPrice`,
        String(documentItemPrice(item.salesPrice)),
        setLineValueOptions,
      );
      form.setValue(`lines.${index}.itemName`, item.name || "", setLineValueOptions);
      
      // If item has tax rate, auto-populate tax
      if (item.taxRateId) {
        form.setValue(`lines.${index}.taxRateId`, item.taxRateId, setLineValueOptions);
      } else {
        form.setValue(`lines.${index}.taxRateId`, "", setLineValueOptions);
      }
    } else {
      // Clear fields if no item selected
      form.setValue(`lines.${index}.itemId`, itemId, setLineValueOptions);
    }
  };

  // Calculate totals with proper tax calculation (preview only — server is source of truth)
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    watchedLines.forEach((line: any) => {
      const qty = Number(line.quantity) || 0;
      const rate = Number(line.unitPrice) || 0;
      const lineAmount = qty * rate;
      subtotal += lineAmount;

      let taxRate = 0;
      if (line.taxRateId) {
        taxRate = getTaxRateFromCode(line.taxRateId);
      } else if (line.taxRate) {
        taxRate = Number(line.taxRate);
      }

      totalTax += lineAmount * (taxRate / 100);
    });

    let discountAmount = 0;
    if (watchedDiscountType === "PERCENTAGE") {
      discountAmount = (subtotal * (Number(watchedDiscountValue) || 0)) / 100;
    } else if (watchedDiscountType === "FIXED") {
      discountAmount = Number(watchedDiscountValue) || 0;
    }

    const total = subtotal - discountAmount + totalTax;
    const incomeWhtAmount = previewWhtAmount({
      enabled: Boolean(watchedIncomeWhtEnabled),
      rate: watchedIncomeWhtRate,
      base: watchedIncomeWhtBase,
      subtotal,
      discount: discountAmount,
      tax: totalTax,
      total,
    });
    const salesTaxWhtAmount = previewWhtAmount({
      enabled: Boolean(watchedSalesTaxWhtEnabled),
      rate: watchedSalesTaxWhtRate,
      base: watchedSalesTaxWhtBase,
      subtotal,
      discount: discountAmount,
      tax: totalTax,
      total,
    });
    const whtAmount = incomeWhtAmount + salesTaxWhtAmount;
    const netSettlement = previewDualNetSettlement(total, [
      {
        amount: incomeWhtAmount,
        addsToCash: whtSettlementAddsToCash(
          watchedIncomeWhtHeldBy || watchedWhtHeldBy,
          "invoice",
        ),
      },
      {
        amount: salesTaxWhtAmount,
        addsToCash: whtSettlementAddsToCash(
          watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
          "invoice",
        ),
      },
    ]);

    return {
      subtotal: formatMoneyAmount(subtotal),
      discount: formatMoneyAmount(discountAmount),
      tax: formatMoneyAmount(totalTax),
      total: formatMoneyAmount(total),
      incomeWhtAmount: formatMoneyAmount(incomeWhtAmount),
      salesTaxWhtAmount: formatMoneyAmount(salesTaxWhtAmount),
      whtAmount: formatMoneyAmount(whtAmount),
      netSettlement: formatMoneyAmount(netSettlement),
    };
  }, [
    watchedLines,
    watchedDiscountType,
    watchedDiscountValue,
    watchedIncomeWhtEnabled,
    watchedIncomeWhtRate,
    watchedIncomeWhtBase,
    watchedIncomeWhtHeldBy,
    watchedSalesTaxWhtEnabled,
    watchedSalesTaxWhtRate,
    watchedSalesTaxWhtBase,
    watchedSalesTaxWhtHeldBy,
    watchedWhtHeldBy,
    getTaxRateFromCode,
  ]);

  // Auto-calculate due date when terms or issue date changes
  useEffect(() => {
    if (watchedTerms && watchedIssueDate) {
      const days = parseInt(watchedTerms);
      if (!isNaN(days)) {
        const issueDate = new Date(watchedIssueDate);
        issueDate.setDate(issueDate.getDate() + days);
        form.setValue("dueDate", issueDate.toISOString().split("T")[0]);
      }
    }
  }, [watchedTerms, watchedIssueDate, form]);

  // Create mode: when customer changes, apply payment terms (default 30).
  const previousCustomerIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (mode !== "create") return;
    if (!watchedCustomerId) {
      previousCustomerIdRef.current = watchedCustomerId;
      return;
    }
    if (previousCustomerIdRef.current === watchedCustomerId) return;
    previousCustomerIdRef.current = watchedCustomerId;
    const customer = customersQuery.data?.find((c: { id: string }) => c.id === watchedCustomerId) as
      | {
          paymentTermsDays?: number | null;
          firstName?: string | null;
          lastName?: string | null;
          phone?: string | null;
          mobile?: string | null;
          contactPersonDepartment?: string | null;
        }
      | undefined;
    const rawDays = customer?.paymentTermsDays;
    const days =
      rawDays == null || Number.isNaN(Number(rawDays)) ? 30 : Math.max(0, Number(rawDays));
    form.setValue("terms", termsFromPaymentDays(days), { shouldDirty: true, shouldValidate: true });
    form.setValue(
      "contactPersonName",
      buildContactPersonName(customer?.firstName, customer?.lastName),
      { shouldDirty: true },
    );
    form.setValue("contactMobile", customer?.mobile ?? customer?.phone ?? "", { shouldDirty: true });
    form.setValue("contactPersonDepartment", customer?.contactPersonDepartment ?? "", {
      shouldDirty: true,
    });
  }, [watchedCustomerId, mode, customersQuery.data, form]);

  const selectedCustomer = customersQuery.data?.find(
    (c: any) => c.id === watchedCustomerId
  );

  const addLine = () => {
    const currentLines = form.getValues("lines") || [];
    form.setValue("lines", [
      ...currentLines,
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
    ]);
  };

  const removeLine = (index: number) => {
    const currentLines = form.getValues("lines");
    form.setValue(
      "lines",
      currentLines.filter((_: any, i: number) => i !== index)
    );
  };

  const clearLines = () => {
    form.setValue("lines", [
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
    ]);
  };

  const currency = watchedCurrencyCode || getCompanyBaseCurrency(company);
  const baseCurrency = getCompanyBaseCurrency(company);

  const documentItemPrice = useCallback(
    (salesPrice: string | number | null | undefined) => {
      const converted = convertBasePriceToDocumentPrice(
        Number(salesPrice ?? 0),
        watchedExchangeRate,
        currency,
        baseCurrency,
      );
      return converted;
    },
    [baseCurrency, currency, watchedExchangeRate],
  );

  // Group items by type for better UX
  const inventoryItems = itemsQuery?.data?.filter((item: any) => item.type === "inventory") || [];
  const nonInventoryItems = itemsQuery?.data?.filter((item: any) => item.type === "non_inventory") || [];
  const serviceItems = itemsQuery?.data?.filter((item: any) => item.type === "service") || [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl bg-white shadow">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to={`/app/company/${companyId}/invoices`}
                className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Invoices
              </Link>
              <h1 className="text-4xl font-bold text-blue-600">INVOICE</h1>
            </div>
            <div className="text-right">
              <div className="mb-2 text-lg">
                <span className="text-gray-500">Balance Due: </span>
                <strong>{formatCurrency(totals.total, currency)}</strong>
              </div>
              <div className="h-20 w-20 rounded bg-gray-200 ml-auto" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold">{company?.name}</h3>
              <p>{company?.addressLine1}</p>
              <p>{company?.addressLine2}</p>
              <p>{company?.city}</p>
            </div>

            <div>
              <p>{company?.email}</p>
              <p>{company?.phone}</p>
            </div>

            <div></div>
          </div>
        </div>

        {/* Customer + Invoice Meta */}
        <div className="bg-slate-100 p-6">
          <div className="grid grid-cols-2 gap-10">
            <div>
              <CounterpartySelect
                createLabel="Create new customer…"
                error={form.formState.errors.customerId?.message}
                label="Customer"
                onChange={(value) => form.setValue("customerId", value, { shouldValidate: true })}
                onCreateNew={onCreateCustomer}
                options={(customersQuery.data ?? []).map((customer: any) => ({
                  id: customer.id,
                  label: customer.displayName,
                  secondary: customer.customerCode ?? undefined,
                }))}
                placeholder="Add Customer"
                value={watchedCustomerId}
              />
              {selectedCustomer && (
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>{selectedCustomer.legalName}</p>
                  <p>{selectedCustomer.billingAddressLine1}</p>
                  <p>
                    {selectedCustomer.billingCity}
                    {selectedCustomer.billingCountry
                      ? `, ${selectedCustomer.billingCountry}`
                      : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Invoice No</label>
                <Input
                  {...form.register("invoiceNumber")}
                  className="border p-2 font-semibold"
                  placeholder="Auto-generated"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">PO Reference</label>
                <Input
                  {...form.register("referenceNumber")}
                  className="border p-2"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Contact person</label>
                <Input
                  {...form.register("contactPersonName")}
                  className="border p-2"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Contact mobile</label>
                <Input
                  {...form.register("contactMobile")}
                  className="border p-2"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Department</label>
                <Input
                  {...form.register("contactPersonDepartment")}
                  className="border p-2"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Delivery date</label>
                <Input
                  type="date"
                  {...form.register("deliveryDate")}
                  className="border p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Delivery challan no</label>
                <Input
                  {...form.register("deliveryChallanNumber")}
                  className="border p-2"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Terms</label>
                <Select
                  {...form.register("terms")}
                  className="border p-2"
                >
                  <option value="0">Due on receipt</option>
                  <option value="15">Net 15</option>
                  <option value="30">Net 30</option>
                  <option value="45">Net 45</option>
                  <option value="60">Net 60</option>
                  <option value="90">Net 90</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Invoice Date</label>
                <Input
                  type="date"
                  {...form.register("issueDate")}
                  className="border p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  {...form.register("dueDate")}
                  className="border p-2"
                />
              </div>

              <DocumentCurrencyFields
                company={company}
                companyId={companyId}
                control={form.control}
                currencyLocked={Boolean(watchedCustomerId)}
                documentCurrencyCode={watchedCurrencyCode}
                errors={form.formState.errors}
                exchangeRateValue={watchedExchangeRate}
                layout="stack"
                register={form.register}
                setValue={form.setValue}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h2 className="mb-4 font-semibold">Products / Services</h2>

          <table className="w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 w-10">#</th>
                <th className="border p-2">Product / Service</th>
                <th className="border p-2">Description</th>
                <th className="border p-2 w-24">Qty</th>
                <th className="border p-2 w-32">Rate (ex-tax)</th>
                <th className="border p-2 w-32">Rate (incl. tax)</th>
                <th className="border p-2 w-32">Tax</th>
                <th className="border p-2 w-28 text-right">Line (ex-tax)</th>
                <th className="border p-2 w-28 text-right">Line (incl. tax)</th>
                <th className="border p-2 w-16"></th>
              </tr>
            </thead>

            <tbody>
              {watchedLines.map((line: any, index: number) => {
                const lineTaxRate = line.taxRateId
                  ? getTaxRateFromCode(line.taxRateId)
                  : Number(line.taxRate || 0);
                const unitEx = Number(line.unitPrice) || 0;
                const unitIncl = exclToIncl(unitEx, lineTaxRate);
                const qty = Number(line.quantity) || 0;
                const lineExAmount = qty * unitEx;
                const lineInclAmount = exclToIncl(lineExAmount, lineTaxRate);

                return (
                <tr key={index}>
                  <td className="border p-2 text-center">{index + 1}</td>

                  <td className="border p-2">
                    <Select
                      value={line.itemId}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      className="w-full"
                    >
                      <option value="">Select Item</option>
                      {(itemsQuery?.data ?? []).map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.salesPrice ? ` - ${formatCurrency(documentItemPrice(item.salesPrice), currency)}` : ""}
                        </option>
                      ))}
                      <option value="__service__">+ Add Service (Manual)</option>
                    </Select>
                  </td>

                  <td className="border p-2">
                    <Input
                      {...form.register(`lines.${index}.description`)}
                      className="w-full"
                      placeholder="Description"
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      type="number"
                      {...form.register(`lines.${index}.quantity`)}
                      className="w-full"
                      min="1"
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      type="number"
                      {...form.register(`lines.${index}.unitPrice`)}
                      className="w-full"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      type="number"
                      className="w-full"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      onBlur={() => {
                        setEditingUnitInclLineIndex(null);
                        setUnitInclDraftByLine((current) => {
                          const next = { ...current };
                          delete next[index];
                          return next;
                        });
                      }}
                      onChange={(event) =>
                        handleUnitInclusiveChange(index, event.target.value, lineTaxRate)
                      }
                      onFocus={() => {
                        setEditingUnitInclLineIndex(index);
                        setUnitInclDraftByLine((current) => ({
                          ...current,
                          [index]: String(Number(unitIncl.toFixed(4))),
                        }));
                      }}
                      value={
                        editingUnitInclLineIndex === index &&
                        unitInclDraftByLine[index] !== undefined
                          ? unitInclDraftByLine[index]
                          : unitIncl
                            ? String(Number(unitIncl.toFixed(4)))
                            : ""
                      }
                    />
                  </td>

                  <td className="border p-2">
                    <Select
                      {...form.register(`lines.${index}.taxRateId`)}
                      className="w-full"
                    >
                      <option value="">No Tax</option>
                      {(taxRatesQuery?.data ?? []).map((taxRate: any) => (
                        <option key={taxRate.id} value={taxRate.id}>
                          {taxRate.name} ({taxRate.ratePercent}%)
                        </option>
                      ))}
                    </Select>
                  </td>

                  <td className="border p-2 text-right font-medium">
                    {formatCurrency(formatMoneyAmount(lineExAmount), currency)}
                  </td>

                  <td className="border p-2 text-right font-medium">
                    {formatCurrency(formatMoneyAmount(lineInclAmount), currency)}
                  </td>

                  <td className="border p-2">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={watchedLines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={addLine} variant="secondary" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Product / Service
            </Button>

            <Button type="button" onClick={clearLines} variant="ghost" size="sm">
              Clear All
            </Button>
          </div>
        </div>

        {/* Notes + Totals */}
        <div className="grid grid-cols-2 gap-10 p-6 border-t">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Payment options
              </label>
              <Controller
                control={form.control}
                name="paymentOptions"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-4">
                    {INVOICE_PAYMENT_OPTIONS.map((option) => {
                      const selected = (field.value ?? []).includes(option.value);
                      return (
                        <label className="flex items-center gap-2 text-sm" key={option.value}>
                          <Checkbox
                            checked={selected}
                            onChange={(event) => {
                              const current: string[] = field.value ?? [];
                              if (event.target.checked) {
                                field.onChange([...current, option.value]);
                              } else {
                                field.onChange(current.filter((value) => value !== option.value));
                              }
                            }}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Note to customer
              </label>
              <textarea
                {...form.register("notes")}
                rows={4}
                className="w-full rounded-xl border border-border/70 p-3 text-sm"
                placeholder="Notes to show on invoice..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Memo on statement
              </label>
              <textarea
                {...form.register("memoOnStatement")}
                rows={4}
                className="w-full rounded-xl border border-border/70 p-3 text-sm"
                placeholder="Memo for customer account statement..."
              />
            </div>
          </div>

          <div>
            <div className="space-y-4 rounded border p-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal, currency)}</span>
              </div>

              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Discount:</span>
                  <Select
                    {...form.register("discountType")}
                    className="border p-1 w-24"
                  >
                    <option value="">None</option>
                    <option value="FIXED">Fixed</option>
                    <option value="PERCENTAGE">%</option>
                  </Select>
                  <Input
                    type="number"
                    {...form.register("discountValue")}
                    className="border p-1 w-20"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <span>-{formatCurrency(totals.discount, currency)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(totals.tax, currency)}</span>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Withholding tax</p>
                <WhtSettingsFields
                  companyName={company?.name ?? company?.legalName}
                  documentKind="invoice"
                  form={form}
                />
              </div>

              <div className="flex justify-between text-xl font-bold border-t pt-4">
                <span>Invoice Total</span>
                <span>{formatCurrency(totals.total, currency)}</span>
              </div>
              {watchedEitherWht ? (
                <>
                  {Number(totals.incomeWhtAmount) > 0 ? (
                    <div className="flex justify-between">
                      <span>Income tax WHT</span>
                      <span>
                        {whtSettlementAddsToCash(
                          watchedIncomeWhtHeldBy || watchedWhtHeldBy,
                          "invoice",
                        )
                          ? "+"
                          : "-"}
                        {formatCurrency(totals.incomeWhtAmount, currency)}
                      </span>
                    </div>
                  ) : null}
                  {Number(totals.salesTaxWhtAmount) > 0 ? (
                    <div className="flex justify-between">
                      <span>Sales tax WHT</span>
                      <span>
                        {whtSettlementAddsToCash(
                          watchedSalesTaxWhtHeldBy || watchedWhtHeldBy,
                          "invoice",
                        )
                          ? "+"
                          : "-"}
                        {formatCurrency(totals.salesTaxWhtAmount, currency)}
                      </span>
                    </div>
                  ) : null}
                  {Number(totals.incomeWhtAmount) <= 0 && Number(totals.salesTaxWhtAmount) <= 0 ? (
                    <div className="flex justify-between">
                      <span>Withholding tax</span>
                      <span>
                        {whtSettlementAddsToCash(
                          watchedIncomeWhtHeldBy ||
                            watchedSalesTaxWhtHeldBy ||
                            watchedWhtHeldBy,
                          "invoice",
                        )
                          ? "+"
                          : "-"}
                        {formatCurrency(totals.whtAmount, currency)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-semibold">
                    <span>
                      {whtNetLabel(
                        watchedIncomeWhtHeldBy ||
                          watchedSalesTaxWhtHeldBy ||
                          watchedWhtHeldBy,
                        "invoice",
                      )}
                    </span>
                    <span>{formatCurrency(totals.netSettlement, currency)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 border-t p-4">
          {submitError?.message ? (
            <Alert title={submitError.message} variant="destructive" />
          ) : null}
          <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Print / Download
            </Button>

            <Button variant="secondary" size="sm">
              Make Recurring
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              Save
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : mode === "create" ? "Review & Send" : "Save Changes"}
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}